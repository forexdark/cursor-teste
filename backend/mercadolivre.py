import os
import httpx
import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import logging
import asyncio

logger = logging.getLogger(__name__)

# URLs atualizadas da API do Mercado Livre (2024)
ML_API_BASE = "https://api.mercadolibre.com"
ML_AUTH_BASE = "https://auth.mercadolivre.com.br"

# Credenciais
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")

# URL de redirecionamento - será configurada dinamicamente
def get_ml_redirect_uri():
    """Obter URI de redirecionamento baseada no ambiente"""
    frontend_url = os.getenv("FRONTEND_URL", "https://vigia-meli.vercel.app")
    return f"{frontend_url}/auth/mercadolivre/callback"

# Armazenamento simples do token (em produção, usar Redis ou banco)
ml_tokens = {}
pkce_codes = {}

class MLTokenManager:
    @staticmethod
    def save_token(user_id: int, token_data: dict):
        """Salva o token OAuth do usuário"""
        try:
            ml_tokens[user_id] = {
                "access_token": token_data["access_token"],
                "refresh_token": token_data.get("refresh_token"),
                "expires_at": datetime.now() + timedelta(seconds=token_data.get("expires_in", 21600)),
                "user_id": token_data.get("user_id"),
                "scope": token_data.get("scope")
            }
            logger.info(f"✅ Token ML salvo para usuário {user_id}")
        except Exception as e:
            logger.error(f"❌ Erro ao salvar token ML: {e}")
    
    @staticmethod
    def get_token(user_id: int) -> Optional[str]:
        """Recupera o token válido do usuário"""
        if user_id not in ml_tokens:
            return None
        
        token_info = ml_tokens[user_id]
        
        # Verificar se o token expirou
        if datetime.now() >= token_info["expires_at"]:
            logger.warning(f"⚠️ Token ML expirado para usuário {user_id}")
            MLTokenManager.revoke_token(user_id)
            return None
        
        return token_info["access_token"]
    
    @staticmethod
    def revoke_token(user_id: int):
        """Remove o token do usuário"""
        if user_id in ml_tokens:
            del ml_tokens[user_id]
            logger.info(f"🗑️ Token ML revogado para usuário {user_id}")

def generate_pkce_codes():
    """Gera code_verifier e code_challenge para PKCE"""
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')
    return code_verifier, code_challenge

def get_ml_auth_url(state: str = None) -> str:
    """Gera URL de autorização OAuth do Mercado Livre"""
    if not ML_CLIENT_ID:
        raise ValueError("ML_CLIENT_ID não configurado")
    
    code_verifier, code_challenge = generate_pkce_codes()
    
    if state:
        pkce_codes[state] = code_verifier
        logger.info(f"🔑 PKCE code_verifier armazenado para state: {state[:10]}...")
    
    redirect_uri = get_ml_redirect_uri()
    
    params = {
        "response_type": "code",
        "client_id": ML_CLIENT_ID,
        "redirect_uri": redirect_uri,
        "scope": "read write offline_access",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256"
    }
    
    if state:
        params["state"] = state
    
    query_params = "&".join([f"{k}={v}" for k, v in params.items()])
    auth_url = f"{ML_AUTH_BASE}/authorization?{query_params}"
    
    logger.info(f"🔗 URL OAuth ML gerada: {auth_url[:80]}...")
    return auth_url

async def exchange_code_for_token(code: str, state: str = None) -> dict:
    """Troca o código OAuth por token de acesso"""
    if not ML_CLIENT_ID or not ML_CLIENT_SECRET:
        raise ValueError("Credenciais ML não configuradas")
    
    code_verifier = None
    if state and state in pkce_codes:
        code_verifier = pkce_codes[state]
        del pkce_codes[state]
    
    token_url = f"{ML_API_BASE}/oauth/token"
    redirect_uri = get_ml_redirect_uri()
    
    data = {
        "grant_type": "authorization_code",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    if code_verifier:
        data["code_verifier"] = code_verifier
    
    logger.info(f"🔄 Trocando código por token ML...")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(token_url, data=data)
            
            if response.status_code == 200:
                token_data = response.json()
                logger.info(f"✅ Token ML obtido com sucesso")
                return token_data
            else:
                error_text = response.text
                logger.error(f"❌ Erro ML token: {response.status_code} - {error_text}")
                raise Exception(f"Erro ao obter token ML: {response.status_code} - {error_text}")
    except Exception as e:
        logger.error(f"❌ Erro na troca de token: {e}")
        raise

async def buscar_produtos_ml_simples(query: str, limit: int = 20) -> Optional[dict]:
    """Busca produtos usando API pública (sempre funciona)"""
    url = f"{ML_API_BASE}/sites/MLB/search"
    
    # Parâmetros básicos e seguros
    params = {
        "q": query,
        "limit": min(limit, 50),  # Máximo de 50
        "offset": 0,
        "sort": "relevance"
    }
    
    try:
        logger.info(f"🔍 Busca pública ML: '{query}' (limit: {limit})")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params)
            
            logger.info(f"📡 ML API response: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Validar estrutura da resposta
                if not isinstance(data, dict):
                    logger.error("❌ Resposta ML inválida: não é um objeto")
                    return None
                
                if "results" not in data:
                    logger.error("❌ Resposta ML inválida: sem campo 'results'")
                    return None
                
                results = data.get("results", [])
                total = data.get("paging", {}).get("total", 0)
                
                logger.info(f"✅ Busca ML pública bem-sucedida: {len(results)} produtos de {total} total")
                
                # Adicionar metadados
                data["_search_type"] = "public"
                data["_query"] = query
                data["_timestamp"] = datetime.now().isoformat()
                
                return data
            
            elif response.status_code == 404:
                logger.warning(f"⚠️ Nenhum resultado para '{query}'")
                return {
                    "results": [],
                    "paging": {"total": 0},
                    "_search_type": "public",
                    "_query": query,
                    "_message": "Nenhum produto encontrado"
                }
            
            else:
                logger.error(f"❌ Erro ML API: {response.status_code} - {response.text[:200]}")
                return None
    
    except asyncio.TimeoutError:
        logger.error(f"❌ Timeout na busca ML para '{query}'")
        return None
    except Exception as e:
        logger.error(f"❌ Erro geral na busca ML: {str(e)[:200]}")
        return None

async def buscar_produtos_ml_com_auth(query: str, user_id: int, limit: int = 20) -> Optional[dict]:
    """Busca produtos usando token de autorização"""
    token = MLTokenManager.get_token(user_id)
    if not token:
        logger.info(f"⚠️ Sem token ML para usuário {user_id}, usando busca pública")
        return await buscar_produtos_ml_simples(query, limit)
    
    url = f"{ML_API_BASE}/sites/MLB/search"
    params = {
        "q": query,
        "limit": min(limit, 50),
        "offset": 0,
        "sort": "relevance"
    }
    
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "VigIA-Backend/1.0"
    }
    
    try:
        logger.info(f"🔑 Busca ML autenticada: '{query}' (usuário: {user_id})")
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                data["_search_type"] = "authenticated"
                data["_query"] = query
                data["_user_id"] = user_id
                data["_timestamp"] = datetime.now().isoformat()
                
                logger.info(f"✅ Busca ML autenticada bem-sucedida: {len(data.get('results', []))} produtos")
                return data
            
            elif response.status_code == 401:
                logger.warning(f"⚠️ Token ML inválido para usuário {user_id}, removendo e tentando busca pública")
                MLTokenManager.revoke_token(user_id)
                return await buscar_produtos_ml_simples(query, limit)
            
            else:
                logger.warning(f"⚠️ Erro na busca autenticada ({response.status_code}), tentando busca pública")
                return await buscar_produtos_ml_simples(query, limit)
    
    except Exception as e:
        logger.warning(f"⚠️ Erro na busca autenticada: {e}, tentando busca pública")
        return await buscar_produtos_ml_simples(query, limit)

async def buscar_produtos_ml(query: str, user_id: int = None, limit: int = 20) -> Optional[dict]:
    """Função principal de busca - tenta autenticada primeiro, depois pública"""
    
    # Validar entrada
    if not query or len(query.strip()) < 2:
        logger.warning("❌ Query inválida ou muito curta")
        return None
    
    query = query.strip()[:100]  # Limitar tamanho
    
    # Se tem usuário, tentar busca autenticada primeiro
    if user_id:
        result = await buscar_produtos_ml_com_auth(query, user_id, limit)
        if result:
            return result
    
    # Fallback para busca pública
    return await buscar_produtos_ml_simples(query, limit)

async def buscar_produto_ml(ml_id: str, user_id: int = None):
    """Busca produto específico por ID"""
    if not ml_id:
        return None
    
    url = f"{ML_API_BASE}/items/{ml_id}"
    headers = {}
    
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            headers["Authorization"] = f"Bearer {token}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "nome": data.get("title"),
                    "preco": data.get("price"),
                    "estoque": data.get("available_quantity"),
                    "url": data.get("permalink"),
                    "thumbnail": data.get("thumbnail"),
                    "vendedor_id": data.get("seller_id"),
                    "_produto_id": ml_id
                }
            else:
                logger.warning(f"⚠️ Produto {ml_id} não encontrado: {resp.status_code}")
                return None
    except Exception as e:
        logger.error(f"❌ Erro ao buscar produto {ml_id}: {e}")
        return None

def check_ml_configuration() -> Dict[str, bool]:
    """Verificar configuração do ML"""
    return {
        "client_id_configured": bool(ML_CLIENT_ID),
        "client_secret_configured": bool(ML_CLIENT_SECRET),
        "ready_for_oauth": bool(ML_CLIENT_ID and ML_CLIENT_SECRET),
        "api_base_url": ML_API_BASE,
        "auth_base_url": ML_AUTH_BASE
    }