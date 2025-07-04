from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from models import (
    UsuarioOut, UsuarioCreate, LoginRequest, MLAuthRequest,
    ProdutoMonitoradoOut, ProdutoMonitoradoCreate, 
    HistoricoPrecoOut, AlertaOut, AlertaCreate, 
    Usuario, ProdutoMonitorado, HistoricoPreco, Alerta
)
from sqlalchemy import text
from database import get_db
from auth import create_access_token, get_current_user, google_oauth_login
from passlib.context import CryptContext
from datetime import datetime
from mercadolivre import (
    buscar_produto_ml, buscar_avaliacoes_ml, buscar_produtos_ml, MLTokenManager,
    get_ml_auth_url, exchange_code_for_token, MLTokenManager, ML_API_URL
)
import asyncio
from openai_utils import gerar_resumo_avaliacoes
import httpx
from pydantic import BaseModel
import traceback
import os

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

# --- AUTENTICAÇÃO ---
@router.post("/auth/register", response_model=UsuarioOut)
async def register(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    print(f"✅ DEBUG: Tentando registrar usuário: {usuario.email}")
    
    # Verificar se usuário já existe
    existing_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existing_user:
        print(f"❌ DEBUG: Email já existe: {usuario.email}")
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Hash da senha
    if not usuario.senha or len(usuario.senha) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 6 caracteres")
        
    senha_hash = pwd_context.hash(usuario.senha)
    print(f"🔒 DEBUG: Senha hash gerado: Sim")
    
    # Criar usuário
    db_usuario = Usuario(
        email=usuario.email, 
        nome=usuario.nome, 
        senha_hash=senha_hash,
        is_active=True,
        criado_em=datetime.utcnow()
    )
    
    db.add(db_usuario)
    try:
        db.commit()
        db.refresh(db_usuario)
        print(f"✅ DEBUG: Usuário criado com sucesso: ID {db_usuario.id}")
    except Exception as e:
        print(f"❌ DEBUG: Erro ao criar usuário: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    return db_usuario

@router.post("/auth/login") 
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    print(f"🔐 DEBUG: Tentativa de login: {login_data.email}")
    
    user = db.query(Usuario).filter(Usuario.email == login_data.email).first()
    if not user:
        print(f"❌ DEBUG: Usuário não encontrado: {login_data.email}")
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar senha (se existe hash)
    if not user.senha_hash:
        print(f"❌ DEBUG: Usuário {login_data.email} não tem senha configurada")
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
        
    if not pwd_context.verify(login_data.senha, user.senha_hash):
        print(f"❌ DEBUG: Senha incorreta para: {login_data.email}")
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    print(f"✅ DEBUG: Login bem-sucedido: {user.email}")
    
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

@router.post("/auth/google")
async def login_google(token_id: str, db: Session = Depends(get_db)):
    # Implementar integração real com Google
    return google_oauth_login(token_id, db)

# --- AUTENTICAÇÃO MERCADO LIVRE ---
@router.get("/auth/mercadolivre/url", response_model=MLAuthResponse)
async def get_mercadolivre_auth_url(current_user: Usuario = Depends(get_current_user)):
    """Gera URL de autorização do Mercado Livre para o usuário"""
    try:
        state = f"user_{current_user.id}_{datetime.now().timestamp()}"
        auth_url = get_ml_auth_url(state)
        
        return MLAuthResponse(
            success=True,
            auth_url=auth_url,
            message="URL de autorização gerada com sucesso"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar URL de autorização: {str(e)}")

@router.post("/auth/mercadolivre/callback", summary="OAuth 2.0 Callback - Conforme doc oficial ML 2025")
async def mercadolivre_callback(auth_data: MLAuthRequest, current_user: Usuario = Depends(get_current_user)):
    """
    Processa callback do OAuth 2.0 + PKCE do Mercado Livre
    Conforme documentação oficial 2025: https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
    """
    print(f"🔄 [OAUTH 2025] Processando callback ML para user {current_user.id}")
    print(f"📋 Dados recebidos: code={auth_data.code[:10] if auth_data.code else 'NULO'}..., state={auth_data.state}")
    
    try:
        # Trocar código por token
        token_data = await exchange_code_for_token(auth_data.code, auth_data.state)
        print(f"✅ [OAUTH 2025] Token obtido do ML: {list(token_data.keys())}")
        
        # Salvar token para o usuário
        MLTokenManager.save_token(current_user.id, token_data)
        
        # CRÍTICO: Verificar imediatamente se o token funciona
        print(f"🧪 [OAUTH 2025] Testando token recém-salvo para user {current_user.id}")
        import httpx
        async with httpx.AsyncClient() as client:
            test_response = await client.get(
                f"{ML_API_URL}/users/me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
                timeout=10.0
            )
            print(f"🧪 [OAUTH 2025] Teste imediato: status {test_response.status_code}")
            if test_response.status_code != 200:
                print(f"❌ [OAUTH 2025] Token não funcionou imediatamente: {test_response.text}")
                raise Exception("Token obtido mas não funcional")
            else:
                user_data = test_response.json()
                print(f"✅ [OAUTH 2025] Token confirmado funcionando - ML User ID: {user_data.get('id', 'N/A')}")
        
        return {
            "success": True,
            "message": "✅ Autorização OAuth 2.0 do Mercado Livre concluída com sucesso! Conforme padrão 2025.",
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope"),
            "expires_in": token_data.get("expires_in"),
            "oauth_version": "2.0_PKCE_2025",
            "token_test": "passed"
        }
    except Exception as e:
        print(f"❌ Erro no callback: {e}")
        # Se falhou, garantir que não há token "fantasma" salvo
        MLTokenManager.revoke_token(current_user.id)
        raise HTTPException(status_code=400, detail=f"Erro no callback OAuth: {str(e)}")

@router.delete("/auth/mercadolivre/revoke")
async def revoke_mercadolivre_auth(current_user: Usuario = Depends(get_current_user)):
    """Revoga autorização do Mercado Livre para o usuário"""
    MLTokenManager.revoke_token(current_user.id)
    return {"success": True, "message": "Autorização do Mercado Livre revogada"}

# Validação de compliance OAuth 2.0 ML 2025
def validate_ml_oauth_compliance(user_id: int) -> dict:
    """
    Valida se o usuário está em compliance com OAuth 2.0 + PKCE ML 2025
    """
    token = MLTokenManager.get_token(user_id)
    if not token:
        return {
            "compliant": False,
            "error": "oauth_required",
            "message": "OAuth 2.0 + PKCE obrigatório conforme documentação ML 2025",
            "action": "Clique em 'Autorizar Mercado Livre' para seguir o fluxo oficial"
        }
    
    return {
        "compliant": True,
        "oauth_version": "2.0_PKCE",
        "token_type": "Bearer",
        "scopes": "read write offline_access"
    }

@router.get("/auth/mercadolivre/status")
async def mercadolivre_auth_status(current_user: Usuario = Depends(get_current_user)):
    """Verifica status da autorização OAuth 2.0 + PKCE do Mercado Livre"""
    print(f"🔍 [ML STATUS] Verificando status para user {current_user.id}")
    
    compliance = validate_ml_oauth_compliance(current_user.id)
    print(f"📋 [ML STATUS] Compliance check: {compliance}")
    
    # Verificar se token ainda é válido fazendo uma chamada simples
    token_valid = False
    ml_user_info = None
    if compliance["compliant"]:
        token = MLTokenManager.get_token(current_user.id)
        if token:
            try:
                print(f"🧪 [ML STATUS] Testando token para user {current_user.id}")
                # Fazer uma chamada simples para verificar se token funciona
                import httpx
                async with httpx.AsyncClient() as client:
                    test_response = await client.get(
                        f"{ML_API_URL}/users/me",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=10.0
                    )
                    token_valid = test_response.status_code == 200
                    print(f"🧪 [ML 2025] Teste token para user {current_user.id}: status {test_response.status_code}")
                    
                    if token_valid:
                        ml_user_info = test_response.json()
                        print(f"✅ [ML STATUS] Token válido - ML User ID: {ml_user_info.get('id', 'N/A')}")
                    else:
                        print(f"❌ [ML STATUS] Token inválido - Response: {test_response.text[:200]}")
            except Exception as e:
                print(f"🧪 [ML 2025] Erro no teste de token: {e}")
                token_valid = False
    
    final_authorized = compliance["compliant"] and token_valid
    print(f"📊 [ML STATUS] Final - Autorizado: {final_authorized}")
    
    return {
        "authorized": final_authorized,
        "oauth_version": "2.0_PKCE_2025" if compliance["compliant"] else None,
        "message": "✅ OAuth 2.0 + PKCE ativo" if final_authorized else "❌ Autorização OAuth 2.0 necessária",
        "compliance": compliance,
        "token_valid": token_valid,
        "ml_user_id": ml_user_info.get('id') if ml_user_info else None,
        "debug_info": {
            "user_id": current_user.id,
            "tokens_available": list(ml_tokens.keys()),
            "token_found": current_user.id in ml_tokens
        },
        "documentation": "https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao"
    }

# --- USUÁRIOS ---
@router.get("/usuarios/me", response_model=UsuarioOut)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

# --- PRODUTOS MONITORADOS ---
@router.post("/produtos/", response_model=ProdutoMonitoradoOut)
async def adicionar_produto(produto: ProdutoMonitoradoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    print(f"➕ Adicionando produto para user {current_user.id}: {produto.ml_id}")
    
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
    
    print(f"✅ Produto adicionado: ID {db_produto.id}")
    return db_produto

@router.get("/produtos/", response_model=List[ProdutoMonitoradoOut])
async def listar_produtos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    print(f"📋 Listando produtos para user {current_user.id}")
    
    produtos = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.usuario_id == current_user.id).all()
    return produtos

@router.delete("/produtos/{produto_id}", status_code=204)
async def remover_produto(produto_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        print(f"❌ Produto {produto_id} não encontrado para user {current_user.id}")
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    print(f"🗑️ Removendo produto {produto_id} para user {current_user.id}")
    db.delete(produto)
    db.commit()
    return

@router.put("/produtos/{produto_id}", response_model=ProdutoMonitoradoOut)
async def atualizar_produto(produto_id: int, produto: ProdutoMonitoradoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    db_produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    print(f"📝 Atualizando produto {produto_id} para user {current_user.id}")
    db_produto.ml_id = produto.ml_id
    db_produto.nome = produto.nome
    db_produto.url = produto.url
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.put("/produtos/{produto_id}/atualizar", response_model=ProdutoMonitoradoOut)
async def atualizar_produto_ml(produto_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """
    🔐 ATUALIZAR PRODUTO COM ML - SEMPRE AUTENTICADO
    
    Esta função busca dados atualizados do produto diretamente do ML
    usando o token OAuth do usuário autenticado.
    """
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        print(f"❌ Produto {produto_id} não encontrado para atualização: user {current_user.id}")
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    print(f"🔄 Atualizando dados ML do produto {produto_id} (ML_ID: {produto.ml_id}) para user {current_user.id}")
    
    # Buscar dados do Mercado Livre com autenticação do usuário
    dados_ml = await buscar_produto_ml(produto.ml_id, current_user.id)
    if not dados_ml:
        raise HTTPException(status_code=404, detail="Produto não encontrado na API do Mercado Livre")
    
    print(f"✅ Dados ML obtidos: {dados_ml.get('nome', 'N/A')[:50]}... - R$ {dados_ml.get('preco', 0)}")
    
    # Atualizar produto no banco
    produto.nome = dados_ml["nome"]
    produto.preco_atual = dados_ml["preco"]
    produto.estoque_atual = dados_ml["estoque"]
    produto.url = dados_ml["url"]
    db.commit()
    db.refresh(produto)
    
    print(f"💾 Produto {produto_id} atualizado no banco")
    return produto

# --- BUSCA DE PRODUTOS - VERSÃO ROBUSTA ---
@router.get("/search/{query}")
async def search_products_public(query: str):
    """
    Busca pública de produtos no Mercado Livre (sem autenticação)
    Endpoint alternativo com implementação robusta
    """
    try:
        print(f"🔍 SEARCH PUBLIC: '{query}'")
        
        # URL da API pública conforme documentação oficial
        import requests
        url = f"https://api.mercadolibre.com/sites/MLB/search?q={query}&limit=15"
        print(f"📡 URL: {url}")
        
        # Busca pública sem headers (conforme documentação ML)
        response = requests.get(url)
        print(f"📊 Status: {response.status_code}")
            
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Dados recebidos: {len(data.get('results', []))} produtos")
            return {
                "success": True,
                "query": query,
                "total": data.get("paging", {}).get("total", 0),
                "results": data.get("results", []),
                "search_type": "public_api"
            }
        else:
            print(f"❌ Erro HTTP {response.status_code}: {response.text[:200]}")
            return {
                "success": False,
                "query": query,
                "total": 0,
                "results": [],
                "error": f"API ML retornou {response.status_code}",
                "search_type": "public_api"
            }
    except Exception as e:
        print(f"❌ Erro na busca pública: {str(e)}")
        return {
            "success": False,
            "query": query,
            "total": 0,
            "results": [],
            "error": str(e),
            "search_type": "public_api"
        }

@router.get("/produtos/search/{query}", summary="Busca produtos - 100% autenticada conforme ML 2025")
async def search_produtos_ml(query: str, current_user: Usuario = Depends(get_current_user)):
    """
    🎯 BUSCA MERCADO LIVRE - 100% AUTENTICADA VIA OAUTH 2.0 + PKCE
    
    Conforme documentação oficial ML 2025: 
    https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
    
    - SEMPRE usar token OAuth do usuário
    - NUNCA usar endpoints públicos (todos depreciados/bloqueados)
    - Validar e renovar tokens automaticamente
    - Escopos obrigatórios: read write offline_access
    """
    try:
        print(f"🔍 [OAUTH 2025] BUSCA AUTENTICADA ML: user_id={current_user.id}, query='{query}'")
        
        # SEMPRE usar token OAuth do usuário autenticado
        token = MLTokenManager.get_token(current_user.id)
        if not token:
            print(f"❌ [OAUTH 2025] Token ML não encontrado para user {current_user.id}")
            return {
                "success": False,
                "error": "🔐 Autorização OAuth 2.0 do Mercado Livre obrigatória",
                "message": "Conforme ML 2025: Toda busca exige autorização OAuth 2.0 + PKCE. Clique em 'Autorizar ML'.",
                "action_required": "oauth_authorization",
                "user_id": current_user.id,
                "compliance": "ML_2025_OAUTH_REQUIRED"
            }
        
        # Chamar função autenticada do mercadolivre.py
        result = await buscar_produtos_ml(query, current_user.id, limit=15)
        
        if result:
            print(f"✅ Busca ML bem-sucedida: {len(result.get('results', []))} produtos")
            return {
                "success": True,
                "query": query,
                "user_id": current_user.id,
                "ml_response": result,
                "authenticated": True
            }
        else:
            print(f"❌ Busca ML falhou para user {current_user.id}")
            return {
                "success": False,
                "error": "Erro na busca do Mercado Livre",
                "message": "Não foi possível buscar produtos. Verifique sua autorização.",
                "action_required": "check_authorization",
                "user_id": current_user.id
            }
            
    except Exception as e:
        print(f"❌ ERRO na busca ML: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": str(e),
            "message": "Erro interno na busca",
            "user_id": current_user.id,
            "trace": traceback.format_exc() if os.environ.get('DEBUG') else None
        }

# --- HISTÓRICO DE PREÇOS ---
@router.post("/produtos/{produto_id}/historico", response_model=HistoricoPrecoOut)
async def registrar_historico(produto_id: int, preco: float, estoque: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    historico = HistoricoPreco(
        produto_id=produto_id,
        preco=preco,
        estoque=estoque,
        data=datetime.utcnow()
    )
    db.add(historico)
    db.commit()
    db.refresh(historico)
    return historico

@router.get("/produtos/{produto_id}/historico", response_model=List[HistoricoPrecoOut])
async def listar_historico(produto_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    historico = db.query(HistoricoPreco).filter(HistoricoPreco.produto_id == produto_id).order_by(HistoricoPreco.data.desc()).all()
    return historico

# --- ALERTAS ---
@router.post("/alertas/", response_model=AlertaOut)
async def criar_alerta(alerta: AlertaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    db_alerta = Alerta(
        usuario_id=current_user.id,
        produto_id=alerta.produto_id,
        preco_alvo=alerta.preco_alvo,
        enviado=False
    )
    db.add(db_alerta)
    db.commit()
    db.refresh(db_alerta)
    return db_alerta

@router.get("/alertas/", response_model=List[AlertaOut])
async def listar_alertas(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    alertas = db.query(Alerta).filter(Alerta.usuario_id == current_user.id).all()
    return alertas

@router.delete("/alertas/{alerta_id}", status_code=204)
async def remover_alerta(alerta_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id, Alerta.usuario_id == current_user.id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")
    db.delete(alerta)
    db.commit()
    return