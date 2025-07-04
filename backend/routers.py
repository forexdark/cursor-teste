from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models import (
    UsuarioOut, UsuarioCreate, LoginRequest, MLAuthRequest,
    ProdutoMonitoradoOut, ProdutoMonitoradoCreate, 
    HistoricoPrecoOut, AlertaOut, AlertaCreate, 
    Usuario, ProdutoMonitorado, HistoricoPreco, Alerta
)
from database import get_db
from auth import create_access_token, get_current_user, google_oauth_login
from passlib.context import CryptContext
from datetime import datetime
from mercadolivre import (
    buscar_produto_ml, buscar_avaliacoes_ml, buscar_produtos_ml,
    get_ml_auth_url, exchange_code_for_token, MLTokenManager
)
import asyncio
from openai_utils import gerar_resumo_avaliacoes
import httpx
from pydantic import BaseModel
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Modelos para resposta
class MLTestResponse(BaseModel):
    success: bool
    message: str
    data: dict = None

class MLAuthResponse(BaseModel):
    success: bool
    auth_url: str = None
    message: str

# Dependency melhorada para banco
def get_db_safe():
    """Dependency que lida graciosamente com banco indisponível"""
    try:
        db_gen = get_db()
        db = next(db_gen)
        if db is None:
            raise HTTPException(
                status_code=503, 
                detail="Banco de dados temporariamente indisponível"
            )
        yield db
    except Exception as e:
        logger.error(f"Erro na conexão com banco: {e}")
        raise HTTPException(
            status_code=503,
            detail="Serviço temporariamente indisponível. Tente novamente em alguns momentos."
        )

# --- AUTENTICAÇÃO ---
@router.post("/auth/register", response_model=UsuarioOut)
async def register(usuario: UsuarioCreate, db: Session = Depends(get_db_safe)):
    logger.info(f"✅ Tentando registrar usuário: {usuario.email}")
    
    try:
        # Verificar se usuário já existe
        existing_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
        if existing_user:
            logger.warning(f"❌ Email já existe: {usuario.email}")
            raise HTTPException(status_code=400, detail="Email já cadastrado")
        
        # Validar senha
        if not usuario.senha or len(usuario.senha) < 6:
            raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
            
        # Hash da senha
        senha_hash = pwd_context.hash(usuario.senha)
        logger.info(f"🔒 Senha hash gerado para: {usuario.email}")
        
        # Criar usuário
        db_usuario = Usuario(
            email=usuario.email, 
            nome=usuario.nome, 
            senha_hash=senha_hash,
            is_active=True,
            criado_em=datetime.utcnow()
        )
        
        db.add(db_usuario)
        db.commit()
        db.refresh(db_usuario)
        logger.info(f"✅ Usuário criado com sucesso: ID {db_usuario.id}")
        
        return db_usuario
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"❌ Erro ao criar usuário: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/auth/login") 
async def login(login_data: LoginRequest, db: Session = Depends(get_db_safe)):
    logger.info(f"🔐 Tentativa de login: {login_data.email}")
    
    try:
        user = db.query(Usuario).filter(Usuario.email == login_data.email).first()
        if not user:
            logger.warning(f"❌ Usuário não encontrado: {login_data.email}")
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        # Verificar senha
        if not user.senha_hash:
            logger.warning(f"❌ Usuário sem senha: {login_data.email}")
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
            
        if not pwd_context.verify(login_data.senha, user.senha_hash):
            logger.warning(f"❌ Senha incorreta: {login_data.email}")
            raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
        logger.info(f"✅ Login bem-sucedido: {user.email}")
        
        access_token = create_access_token(data={"sub": user.email})
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "nome": user.nome
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro no login: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

@router.post("/auth/google")
async def login_google(token_id: str, db: Session = Depends(get_db_safe)):
    # Implementar integração real com Google
    return google_oauth_login(token_id, db)

# --- AUTENTICAÇÃO MERCADO LIVRE ---
@router.get("/auth/mercadolivre/status")
async def mercadolivre_auth_status(current_user: Usuario = Depends(get_current_user)):
    """Verificar status da autorização do Mercado Livre"""
    try:
        # Verificar se credenciais ML estão configuradas
        ml_client_id = os.getenv("ML_CLIENT_ID")
        ml_client_secret = os.getenv("ML_CLIENT_SECRET")
        
        if not ml_client_id or not ml_client_secret:
            return {
                "authorized": False,
                "message": "Mercado Livre não configurado no servidor",
                "error": "missing_credentials"
            }
        
        # Verificar se usuário tem token válido
        token = MLTokenManager.get_token(current_user.id)
        return {
            "authorized": token is not None,
            "message": "Autorizado" if token else "Não autorizado",
            "ml_configured": True
        }
    except Exception as e:
        logger.error(f"Erro ao verificar status ML: {e}")
        return {
            "authorized": False,
            "message": "Erro ao verificar status",
            "error": str(e)
        }

@router.get("/auth/mercadolivre/url", response_model=MLAuthResponse)
async def get_mercadolivre_auth_url(current_user: Usuario = Depends(get_current_user)):
    """Gera URL de autorização do Mercado Livre para o usuário"""
    try:
        # Verificar se credenciais estão configuradas
        ml_client_id = os.getenv("ML_CLIENT_ID")
        ml_client_secret = os.getenv("ML_CLIENT_SECRET")
        
        if not ml_client_id or not ml_client_secret:
            return MLAuthResponse(
                success=False,
                message="Mercado Livre não configurado no servidor. Configure ML_CLIENT_ID e ML_CLIENT_SECRET."
            )
        
        # Gerar estado único para o usuário
        state = f"user_{current_user.id}_{datetime.now().timestamp()}"
        auth_url = get_ml_auth_url(state)
        
        return MLAuthResponse(
            success=True,
            auth_url=auth_url,
            message="URL de autorização gerada com sucesso"
        )
    except Exception as e:
        logger.error(f"Erro ao gerar URL ML: {e}")
        return MLAuthResponse(
            success=False,
            message=f"Erro ao gerar URL de autorização: {str(e)}"
        )

@router.post("/auth/mercadolivre/callback")
async def mercadolivre_callback(auth_data: MLAuthRequest, current_user: Usuario = Depends(get_current_user)):
    """Processa callback do OAuth do Mercado Livre"""
    try:
        logger.info(f"🔄 Processando callback ML para usuário {current_user.id}")
        
        # Verificar se credenciais estão configuradas
        ml_client_id = os.getenv("ML_CLIENT_ID")
        ml_client_secret = os.getenv("ML_CLIENT_SECRET")
        
        if not ml_client_id or not ml_client_secret:
            raise HTTPException(
                status_code=503, 
                detail="Mercado Livre não configurado no servidor"
            )
        
        # Trocar código por token
        token_data = await exchange_code_for_token(auth_data.code, auth_data.state)
        
        # Salvar token para o usuário
        MLTokenManager.save_token(current_user.id, token_data)
        
        logger.info(f"✅ Autorização ML concluída para usuário {current_user.id}")
        
        return {
            "success": True,
            "message": "Autorização do Mercado Livre concluída com sucesso",
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope")
        }
    except Exception as e:
        logger.error(f"❌ Erro no callback ML para usuário {current_user.id}: {e}")
        raise HTTPException(status_code=400, detail=f"Erro no callback OAuth: {str(e)}")

@router.delete("/auth/mercadolivre/revoke")
async def revoke_mercadolivre_auth(current_user: Usuario = Depends(get_current_user)):
    """Revoga autorização do Mercado Livre para o usuário"""
    try:
        MLTokenManager.revoke_token(current_user.id)
        return {"success": True, "message": "Autorização do Mercado Livre revogada"}
    except Exception as e:
        logger.error(f"Erro ao revogar ML: {e}")
        raise HTTPException(status_code=500, detail="Erro ao revogar autorização")

# --- PRODUTOS MONITORADOS ---
@router.post("/produtos/", response_model=ProdutoMonitoradoOut)
async def adicionar_produto(produto: ProdutoMonitoradoCreate, db: Session = Depends(get_db_safe), current_user: Usuario = Depends(get_current_user)):
    try:
        db_produto = ProdutoMonitorado(
            usuario_id=current_user.id,
            ml_id=produto.ml_id,
            nome=produto.nome,
            url=produto.url,
            preco_atual=0.0,
            estoque_atual=0,
            criado_em=datetime.utcnow()
        )
        db.add(db_produto)
        db.commit()
        db.refresh(db_produto)
        return db_produto
    except Exception as e:
        logger.error(f"Erro ao adicionar produto: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro ao adicionar produto")

@router.get("/produtos/", response_model=List[ProdutoMonitoradoOut])
async def listar_produtos(db: Session = Depends(get_db_safe), current_user: Usuario = Depends(get_current_user)):
    try:
        produtos = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.usuario_id == current_user.id).all()
        return produtos
    except Exception as e:
        logger.error(f"Erro ao listar produtos: {e}")
        raise HTTPException(status_code=500, detail="Erro ao listar produtos")

# --- BUSCA DE PRODUTOS ---
@router.get("/produtos/search/{query}")
async def buscar_produtos(query: str, current_user: Usuario = Depends(get_current_user)):
    """Busca produtos no Mercado Livre"""
    
    # Validar query
    if not query or len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Termo de busca deve ter pelo menos 2 caracteres")
    
    query_clean = query.strip()[:100]  # Limitar tamanho
    logger.info(f"🔍 Busca ML: '{query_clean}' (usuário: {current_user.id})")
    
    try:
        # Buscar produtos com timeout
        import asyncio
        resultados = await asyncio.wait_for(
            buscar_produtos_ml(query_clean, current_user.id, limit=15),
            timeout=20.0
        )
        
        if not resultados:
            logger.warning(f"⚠️ Busca retornou None para '{query_clean}'")
            return {
                "success": False,
                "query": query_clean,
                "total": 0,
                "results": [],
                "message": "Nenhum produto encontrado ou erro na API do Mercado Livre"
            }
        
        search_type = resultados.get("_search_type", "authenticated")
        total_results = resultados.get("paging", {}).get("total", 0)
        products = resultados.get("results", [])
        
        logger.info(f"✅ Busca '{query_clean}': {len(products)} produtos de {total_results} total (tipo: {search_type})")
        
        return {
            "success": True,
            "query": query_clean,
            "total": total_results,
            "results": products,
            "search_type": search_type,
            "message": f"Busca {'autenticada' if search_type == 'authenticated' else 'pública'} bem-sucedida"
        }
    
    except asyncio.TimeoutError:
        logger.error(f"❌ Timeout na busca '{query_clean}'")
        raise HTTPException(status_code=504, detail="Timeout na busca. Tente novamente.")
    
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error(f"❌ Erro na busca '{query_clean}': {str(e)[:200]}")
        
        # Não retornar erro 500, mas sim uma resposta com sucesso=false
        return {
            "success": False,
            "query": query_clean,
            "total": 0,
            "results": [],
            "error": "Erro interno na busca",
            "message": "Erro temporário. Tente novamente em alguns momentos."
        }

@router.get("/test/search-public/{query}")
async def test_search_public(query: str):
    """Testar busca pública (sem autenticação)"""
    try:
        if not query or len(query.strip()) < 2:
            return {"success": False, "message": "Query muito curta"}
        
        query_clean = query.strip()[:100]
        logger.info(f"🧪 Teste busca pública: '{query_clean}'")
        
        import asyncio
        resultados = await asyncio.wait_for(
            buscar_produtos_ml_simples(query_clean, limit=5),
            timeout=15.0
        )
        
        if not resultados:
            return {"success": False, "message": "Nenhum resultado encontrado"}
        
        return {
            "success": True,
            "query": query_clean,
            "total": resultados.get("paging", {}).get("total", 0),
            "results": resultados.get("results", [])[:3],
            "search_type": resultados.get("_search_type", "public"),
            "message": "Busca pública funcionando",
            "timestamp": resultados.get("_timestamp")
        }
    except asyncio.TimeoutError:
        return {"success": False, "message": "Timeout na busca pública"}
    except Exception as e:
        logger.error(f"❌ Erro no teste de busca: {str(e)[:200]}")
        return {"success": False, "message": f"Erro: {str(e)[:100]}"}

# --- TESTES E DIAGNÓSTICO ---
@router.get("/test/health")
async def test_health():
    """Endpoint para testar se a API está funcionando"""
    return {
        "status": "ok", 
        "message": "Rotas funcionando corretamente", 
        "timestamp": datetime.utcnow()
    }

@router.get("/test/mercadolivre", response_model=MLTestResponse)
async def test_mercadolivre():
    """Testar conectividade com a API do Mercado Livre"""
    try:
        from mercadolivre import check_ml_configuration, buscar_produtos_ml_simples
        
        # Verificar configuração
        config_status = check_ml_configuration()
        
        # Teste real da API
        test_result = await buscar_produtos_ml_simples("teste", limit=1)
        
        if test_result and test_result.get("results"):
            return MLTestResponse(
                success=True,
                message="API Mercado Livre funcionando perfeitamente",
                data={
                    **config_status,
                    "api_test": "success",
                    "total_results": test_result.get("paging", {}).get("total", 0),
                    "sample_product": test_result.get("results", [{}])[0].get("title", "N/A") if test_result.get("results") else "N/A",
                    "search_type": test_result.get("_search_type", "unknown"),
                    "timestamp": test_result.get("_timestamp")
                }
            )
        else:
            return MLTestResponse(
                success=False,
                message="API Mercado Livre não retornou resultados",
                data={**config_status, "api_test": "no_results"}
            )
    except Exception as e:
        logger.error(f"❌ Erro no teste ML: {e}")
        return MLTestResponse(
            success=False,
            message=f"Erro ao conectar com ML: {str(e)[:100]}",
            data={"error": str(e)[:200]}
        )

@router.get("/test/database")
async def test_database_router():
    """Testar banco de dados via rota"""
    try:
        from database import get_database_status
        status = get_database_status()
        
        return {
            "success": status["connection_test"],
            "message": "Banco funcionando" if status["connection_test"] else "Problema no banco",
            "details": status,
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro no teste: {str(e)}",
            "timestamp": datetime.utcnow()
        }

@router.get("/test/ml-config")
async def test_ml_config():
    """Testar configuração do Mercado Livre"""
    ml_client_id = os.getenv("ML_CLIENT_ID")
    ml_client_secret = os.getenv("ML_CLIENT_SECRET")
    
    return {
        "ml_client_id_configured": bool(ml_client_id),
        "ml_client_secret_configured": bool(ml_client_secret),
        "ml_client_id_preview": ml_client_id[:15] + "..." if ml_client_id else None,
        "ready_for_oauth": bool(ml_client_id and ml_client_secret),
        "next_steps": [
            "Configure ML_CLIENT_ID no Railway" if not ml_client_id else "✅ ML_CLIENT_ID configurado",
            "Configure ML_CLIENT_SECRET no Railway" if not ml_client_secret else "✅ ML_CLIENT_SECRET configurado",
            "Registre aplicação no Mercado Livre Developers" if not (ml_client_id and ml_client_secret) else "✅ Configuração completa"
        ]
    }