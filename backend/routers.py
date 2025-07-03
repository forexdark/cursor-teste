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
    print(f"DEBUG: Tentando registrar usuário: {usuario.email}")
    
    # Verificar se usuário já existe
    existing_user = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if existing_user:
        print(f"DEBUG: Email já existe: {usuario.email}")
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Hash da senha
    senha_hash = pwd_context.hash(usuario.senha) if usuario.senha else None
    print(f"DEBUG: Senha hash gerado: {'Sim' if senha_hash else 'Não'}")
    
    # Criar usuário
    db_usuario = Usuario(
        email=usuario.email, 
        nome=usuario.nome, 
        senha_hash=senha_hash,
        is_active=True
    )
    
    db.add(db_usuario)
    try:
        db.commit()
        db.refresh(db_usuario)
        print(f"DEBUG: Usuário criado com sucesso: ID {db_usuario.id}")
    except Exception as e:
        print(f"DEBUG: Erro ao criar usuário: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
    
    return db_usuario

@router.post("/auth/login") 
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    print(f"DEBUG: Tentativa de login: {login_data.email}")
    
    user = db.query(Usuario).filter(Usuario.email == login_data.email).first()
    if not user:
        print(f"DEBUG: Usuário não encontrado: {login_data.email}")
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Verificar senha (se existe hash)
    if user.senha_hash and not pwd_context.verify(login_data.senha, user.senha_hash):
        print(f"DEBUG: Senha incorreta para: {login_data.email}")
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    print(f"DEBUG: Login bem-sucedido: {user.email}")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

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

@router.post("/auth/mercadolivre/callback")
async def mercadolivre_callback(auth_data: MLAuthRequest, current_user: Usuario = Depends(get_current_user)):
    """Processa callback do OAuth do Mercado Livre"""
    try:
        # Trocar código por token
        token_data = await exchange_code_for_token(auth_data.code)
        
        # Salvar token para o usuário
        MLTokenManager.save_token(current_user.id, token_data)
        
        return {
            "success": True,
            "message": "Autorização do Mercado Livre concluída com sucesso",
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro no callback OAuth: {str(e)}")

@router.delete("/auth/mercadolivre/revoke")
async def revoke_mercadolivre_auth(current_user: Usuario = Depends(get_current_user)):
    """Revoga autorização do Mercado Livre para o usuário"""
    MLTokenManager.revoke_token(current_user.id)
    return {"success": True, "message": "Autorização do Mercado Livre revogada"}

@router.get("/auth/mercadolivre/status")
async def mercadolivre_auth_status(current_user: Usuario = Depends(get_current_user)):
    """Verifica status da autorização do Mercado Livre"""
    token = MLTokenManager.get_token(current_user.id)
    return {
        "authorized": token is not None,
        "message": "Autorizado" if token else "Não autorizado"
    }

# --- USUÁRIOS ---
@router.get("/usuarios/me", response_model=UsuarioOut)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    return current_user

# --- PRODUTOS MONITORADOS ---
@router.post("/produtos/", response_model=ProdutoMonitoradoOut)
async def adicionar_produto(produto: ProdutoMonitoradoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
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

@router.get("/produtos/", response_model=List[ProdutoMonitoradoOut])
async def listar_produtos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produtos = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.usuario_id == current_user.id).all()
    return produtos

@router.delete("/produtos/{produto_id}", status_code=204)
async def remover_produto(produto_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(produto)
    db.commit()
    return

@router.put("/produtos/{produto_id}", response_model=ProdutoMonitoradoOut)
async def atualizar_produto(produto_id: int, produto: ProdutoMonitoradoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    db_produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not db_produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db_produto.ml_id = produto.ml_id
    db_produto.nome = produto.nome
    db_produto.url = produto.url
    db.commit()
    db.refresh(db_produto)
    return db_produto

@router.put("/produtos/{produto_id}/atualizar", response_model=ProdutoMonitoradoOut)
async def atualizar_produto_ml(produto_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Buscar dados do Mercado Livre com autenticação do usuário
    dados_ml = await buscar_produto_ml(produto.ml_id, current_user.id)
    if not dados_ml:
        raise HTTPException(status_code=404, detail="Produto não encontrado na API do Mercado Livre")
    
    produto.nome = dados_ml["nome"]
    produto.preco_atual = dados_ml["preco"]
    produto.estoque_atual = dados_ml["estoque"]
    produto.url = dados_ml["url"]
    db.commit()
    db.refresh(produto)
    return produto

# --- BUSCA DE PRODUTOS ---
@router.get("/produtos/search/{query}")
async def buscar_produtos(query: str, current_user: Usuario = Depends(get_current_user)):
    """Busca produtos no Mercado Livre usando token do usuário quando disponível"""
    try:
        resultados = await buscar_produtos_ml(query, current_user.id)
        
        if not resultados:
            raise HTTPException(status_code=404, detail="Nenhum produto encontrado")
        
        return {
            "success": True,
            "query": query,
            "total": resultados.get("paging", {}).get("total", 0),
            "results": resultados.get("results", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na busca: {str(e)}")

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
    # Supondo que alerta tem produto_id e preco_alvo
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

@router.get("/produtos/{produto_id}/resumo_avaliacoes")
async def resumo_avaliacoes(produto_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    produto = db.query(ProdutoMonitorado).filter(ProdutoMonitorado.id == produto_id, ProdutoMonitorado.usuario_id == current_user.id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    avaliacoes = await buscar_avaliacoes_ml(produto.ml_id, current_user.id)
    resumo = await gerar_resumo_avaliacoes(avaliacoes)
    return {"resumo": resumo}

# --- TESTES E DIAGNOSTICOS ---
@router.get("/test/health")
async def test_health():
    """Endpoint para testar se a API está funcionando"""
    return {"status": "ok", "message": "Backend funcionando corretamente", "timestamp": datetime.utcnow()}

@router.get("/test/mercadolivre", response_model=MLTestResponse)
async def test_mercadolivre():
    """Testar conectividade com a API do Mercado Livre (sem autenticação)"""
    try:
        # Testar busca pública (sem autenticação)
        async with httpx.AsyncClient() as client:
            response = await client.get("https://api.mercadolibre.com/sites/MLB/search?q=teste&limit=1")
        
        if response.status_code == 200:
            data = response.json()
            return MLTestResponse(
                success=True,
                message="Conexão com Mercado Livre OK (acesso público)",
                data={
                    "total_results": data.get("paging", {}).get("total", 0),
                    "sample_product": data.get("results", [{}])[0].get("title", "Nenhum produto") if data.get("results") else "Nenhum resultado"
                }
            )
        else:
            return MLTestResponse(
                success=False,
                message=f"Erro HTTP {response.status_code}",
                data={}
            )
    except Exception as e:
        return MLTestResponse(
            success=False,
            message=f"Erro ao conectar com Mercado Livre: {str(e)}",
            data={}
        )

@router.get("/test/search/{query}")
async def test_search(query: str):
    """Testar busca de produtos no Mercado Livre (sem autenticação)"""
    try:
        url = f"https://api.mercadolibre.com/sites/MLB/search?q={query}&limit=5"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "message": f"Busca por '{query}' realizada com sucesso (acesso público)",
                "total_results": data.get("paging", {}).get("total", 0),
                "results": data.get("results", [])[:3]  # Apenas 3 primeiros
            }
        else:
            return {
                "success": False,
                "message": f"Erro HTTP {response.status_code}",
                "note": "APIs avançadas do ML podem precisar de autenticação OAuth",
                "data": {}
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro na busca: {str(e)}",
            "data": {}
        }

@router.get("/test/database")
async def test_database(db: Session = Depends(get_db)):
    """Testar conexão com banco de dados"""
    try:
        # Contar usuários
        total_usuarios = db.query(Usuario).count()
        total_produtos = db.query(ProdutoMonitorado).count()
        total_alertas = db.query(Alerta).count()
        
        return {
            "success": True,
            "message": "Conexão com banco de dados OK",
            "stats": {
                "usuarios": total_usuarios,
                "produtos": total_produtos,
                "alertas": total_alertas
            }
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Erro no banco de dados: {str(e)}",
            "stats": {}
        }