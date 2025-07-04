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

@router.post("/auth/mercadolivre/callback")
async def mercadolivre_callback(auth_data: MLAuthRequest, current_user: Usuario = Depends(get_current_user)):
    """Processa callback do OAuth do Mercado Livre"""
    print(f"🔄 Processando callback ML para user {current_user.id}")
    print(f"📋 Dados recebidos: code={auth_data.code[:10] if auth_data.code else 'NULO'}..., state={auth_data.state}")
    
    try:
        # Trocar código por token
        token_data = await exchange_code_for_token(auth_data.code, auth_data.state)
        
        # Salvar token para o usuário
        MLTokenManager.save_token(current_user.id, token_data)
        
        return {
            "success": True,
            "message": "Autorização do Mercado Livre concluída com sucesso!",
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope"),
            "expires_in": token_data.get("expires_in")
        }
    except Exception as e:
        print(f"❌ Erro no callback: {e}")
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

# --- BUSCA DE PRODUTOS - APENAS CORRIGIDA PARA RETORNAR JSON ---
@router.get("/search/{query}")
async def search_products_public(query: str):
    """Busca pública de produtos no Mercado Livre (sem autenticação)"""
    try:
        import httpx
        url = f"https://api.mercadolibre.com/sites/MLB/search?q={query}&limit=15"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "query": query,
                "total": data.get("paging", {}).get("total", 0),
                "results": data.get("results", []),
                "search_type": "public"
            }
        else:
            return {
                "success": False,
                "query": query,
                "total": 0,
                "results": [],
                "error": f"ML API returned {response.status_code}",
                "search_type": "public"
            }
    except Exception as e:
        return {
            "success": False,
            "query": query,
            "total": 0,
            "results": [],
            "error": str(e),
            "search_type": "public"
        }

@router.get("/produtos/search-enhanced/{query}")
async def buscar_produtos_detalhados(query: str, current_user: Usuario = Depends(get_current_user)):
    """Busca produtos com máximo de detalhes da API do Mercado Livre"""
    try:
        print(f"🔍 Busca detalhada iniciada: '{query}' para user {current_user.id}")
        
        # 1. Busca inicial na API do ML
        async with httpx.AsyncClient() as client:
            search_url = f"https://api.mercadolibre.com/sites/MLB/search?q={query}&limit=10"
            print(f"📡 URL de busca: {search_url}")
            
            search_response = await client.get(search_url, timeout=15.0)
            
            if search_response.status_code != 200:
                print(f"❌ Erro na busca inicial: {search_response.status_code}")
                return {
                    "success": False,
                    "query": query,
                    "error": f"ML API returned {search_response.status_code}",
                    "results": []
                }
            
            search_data = search_response.json()
            produtos_base = search_data.get("results", [])
            
            if not produtos_base:
                print("⚠️ Nenhum produto encontrado na busca inicial")
                return {
                    "success": False,
                    "query": query,
                    "message": "Nenhum produto encontrado no Mercado Livre",
                    "results": []
                }
            
            print(f"📦 {len(produtos_base)} produtos encontrados na busca inicial")
            
            # 2. Enriquecer dados dos primeiros 5 produtos
            produtos_detalhados = []
            
            for i, produto in enumerate(produtos_base[:5]):  # Limitar a 5 para performance
                try:
                    produto_id = produto["id"]
                    print(f"🔍 Detalhando produto {i+1}/5: {produto_id}")
                    
                    # Buscar detalhes do produto
                    produto_detail_response = await client.get(
                        f"https://api.mercadolibre.com/items/{produto_id}", 
                        timeout=5.0
                    )
                    
                    produto_detail = produto_detail_response.json() if produto_detail_response.status_code == 200 else {}
                    
                    # Buscar dados do vendedor
                    vendedor_data = {}
                    if produto.get("seller", {}).get("id"):
                        vendedor_response = await client.get(
                            f"https://api.mercadolibre.com/users/{produto['seller']['id']}", 
                            timeout=3.0
                        )
                        vendedor_data = vendedor_response.json() if vendedor_response.status_code == 200 else {}
                    
                    # Buscar avaliações (pode falhar, é opcional)
                    reviews_data = None
                    try:
                        reviews_response = await client.get(
                            f"https://api.mercadolibre.com/reviews/item/{produto_id}",
                            timeout=3.0
                        )
                        if reviews_response.status_code == 200:
                            reviews_json = reviews_response.json()
                            reviews_data = {
                                "rating_average": reviews_json.get("rating_average"),
                                "total": reviews_json.get("total"),
                                "reviews": reviews_json.get("reviews", [])[:3]  # Primeiras 3 reviews
                            }
                    except:
                        pass  # Reviews são opcionais
                    
                    # Montar produto detalhado
                    produto_completo = {
                        "id": produto_id,
                        "title": produto.get("title", ""),
                        "price": produto.get("price", 0),
                        "original_price": produto.get("original_price"),
                        "currency_id": produto.get("currency_id", "BRL"),
                        "available_quantity": produto.get("available_quantity", 0),
                        "sold_quantity": produto.get("sold_quantity", 0),
                        "condition": produto.get("condition", "unknown"),
                        "permalink": produto.get("permalink", ""),
                        "thumbnail": produto.get("thumbnail", ""),
                        "pictures": produto_detail.get("pictures", [])[:3],  # Primeiras 3 imagens
                        "attributes": produto.get("attributes", [])[:5],  # Primeiros 5 atributos
                        "shipping": {
                            "free_shipping": produto.get("shipping", {}).get("free_shipping", False),
                            "mode": produto.get("shipping", {}).get("mode"),
                            "logistic_type": produto.get("shipping", {}).get("logistic_type")
                        },
                        "installments": produto.get("installments"),
                        "seller": {
                            "id": produto.get("seller", {}).get("id"),
                            "nickname": vendedor_data.get("nickname"),
                            "registration_date": vendedor_data.get("registration_date"),
                            "country_id": vendedor_data.get("country_id"),
                            "seller_reputation": vendedor_data.get("seller_reputation", {}),
                            "transactions": vendedor_data.get("seller_reputation", {}).get("transactions", {}),
                            "metrics": vendedor_data.get("seller_reputation", {}).get("metrics", {})
                        },
                        "location": produto.get("location"),
                        "reviews": reviews_data,
                        "category_id": produto.get("category_id"),
                        "listing_type_id": produto.get("listing_type_id"),
                        "warranty": produto_detail.get("warranty"),
                        "tags": produto.get("tags", [])
                    }
                    
                    produtos_detalhados.append(produto_completo)
                    print(f"✅ Produto {produto_id} detalhado com sucesso")
                    
                except Exception as e:
                    print(f"⚠️ Erro ao detalhar produto {produto.get('id', 'unknown')}: {e}")
                    # Adicionar produto básico mesmo se falhar o detalhamento
                    produtos_detalhados.append({
                        "id": produto.get("id"),
                        "title": produto.get("title", ""),
                        "price": produto.get("price", 0),
                        "available_quantity": produto.get("available_quantity", 0),
                        "permalink": produto.get("permalink", ""),
                        "thumbnail": produto.get("thumbnail", ""),
                        "condition": produto.get("condition", "unknown"),
                        "seller": produto.get("seller", {}),
                        "shipping": produto.get("shipping", {}),
                        "error": "Detalhamento parcial"
                    })
            
            print(f"✅ Busca detalhada concluída: {len(produtos_detalhados)} produtos processados")
            
            return {
                "success": True,
                "query": query,
                "total": search_data.get("paging", {}).get("total", len(produtos_detalhados)),
                "available_filters": search_data.get("available_filters", []),
                "results": produtos_detalhados,
                "search_type": "enhanced",
                "ml_api_version": "2025"
            }
            
    except httpx.TimeoutException:
        print("❌ Timeout na busca do Mercado Livre")
        return {
            "success": False,
            "query": query,
            "error": "Timeout na busca - tente um termo mais específico",
            "results": []
        }
    except Exception as e:
        print(f"❌ Erro na busca detalhada: {e}")
        return {
            "success": False,
            "query": query,
            "error": str(e),
            "results": []
        }

@router.get("/produtos/search/{query}")
async def buscar_produtos(query: str, current_user: Usuario = Depends(get_current_user)):
    """Busca produtos no Mercado Livre - versão simplificada e robusta"""
    try:
        print(f"🔍 Busca simples iniciada: '{query}' para user {current_user.id}")
        
        # Busca direta na API do Mercado Livre
        async with httpx.AsyncClient() as client:
            url = f"https://api.mercadolibre.com/sites/MLB/search?q={query.strip()}&limit=15"
            print(f"📡 Fazendo requisição para: {url}")
            
            response = await client.get(url, timeout=10.0)
            print(f"📊 Status da resposta: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                total_found = data.get("paging", {}).get("total", 0)
                results = data.get("results", [])
                
                print(f"📦 ML retornou {len(results)} produtos (total disponível: {total_found})")
                
                if not results:
                    return {
                        "success": False,
                        "query": query,
                        "total": 0,
                        "results": [],
                        "message": f"Nenhum produto encontrado para '{query}' no Mercado Livre"
                    }
        
                return {
                    "success": True,
                    "query": query,
                    "total": total_found,
                    "results": results,
                    "search_type": "simple_ml_api"
                }
            else:
                print(f"❌ ML API retornou erro {response.status_code}")
                return {
                    "success": False,
                    "query": query,
                    "total": 0,
                    "results": [],
                    "error": f"Mercado Livre API retornou erro {response.status_code}"
                }
                
    except Exception as e:
        print(f"❌ Erro na busca: {e}")
        return {
            "success": False,
            "query": query,
            "total": 0,
            "results": [],
            "error": str(e)
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
async def remover_alerta(alerta_id: int, db: Session = Depends(