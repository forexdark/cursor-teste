import os
import httpx
import secrets
import hashlib
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

ML_API_URL = "https://api.mercadolibre.com"
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")

# URL de redirecionamento - será configurada dinamicamente
def get_ml_redirect_uri():
    """Obter URI de redirecionamento baseada no ambiente"""
    frontend_url = os.getenv("FRONTEND_URL", "https://vigia-meli.vercel.app")
    return f"{frontend_url}/auth/mercadolivre/callback"

# Armazenamento simples do token (em produção, usar Redis ou banco)
ml_tokens = {}
# Armazenamento temporário para PKCE code_verifiers
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
            return MLTokenManager.refresh_token(user_id)
        
        return token_info["access_token"]
    
    @staticmethod
    def refresh_token(user_id: int) -> Optional[str]:
        """Renova o token OAuth usando refresh_token"""
        if user_id not in ml_tokens:
            return None
        
        token_info = ml_tokens[user_id]
        refresh_token = token_info.get("refresh_token")
        
        if not refresh_token:
            logger.warning(f"⚠️ Sem refresh token para usuário {user_id}")
            del ml_tokens[user_id]
            return None
        
        # TODO: Implementar refresh do token com API do ML
        del ml_tokens[user_id]
        logger.info(f"🗑️ Token expirado removido para usuário {user_id}")
        return None
    
    @staticmethod
    def revoke_token(user_id: int):
        """Remove o token do usuário"""
        if user_id in ml_tokens:
            del ml_tokens[user_id]
            logger.info(f"🗑️ Token ML revogado para usuário {user_id}")

def generate_pkce_codes():
    """Gera code_verifier e code_challenge para PKCE"""
    # Gerar code_verifier (random string de 43-128 caracteres)
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    
    # Gerar code_challenge (SHA256 hash do code_verifier, base64url encoded)
    challenge_bytes = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')
    
    return code_verifier, code_challenge

def get_ml_auth_url(state: str = None) -> str:
    """Gera URL de autorização OAuth do Mercado Livre com PKCE"""
    if not ML_CLIENT_ID:
        raise ValueError("ML_CLIENT_ID não configurado")
    
    # Gerar códigos PKCE
    code_verifier, code_challenge = generate_pkce_codes()
    
    # Armazenar code_verifier temporariamente usando state como chave
    if state:
        pkce_codes[state] = code_verifier
        logger.info(f"🔑 PKCE code_verifier armazenado para state: {state[:10]}...")
    
    base_url = "https://auth.mercadolivre.com.br/authorization"
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
    auth_url = f"{base_url}?{query_params}"
    
    logger.info(f"🔗 URL OAuth ML gerada com PKCE: {auth_url[:80]}...")
    return auth_url

async def exchange_code_for_token(code: str, state: str = None) -> dict:
    """Troca o código OAuth por token de acesso usando PKCE"""
    if not ML_CLIENT_ID or not ML_CLIENT_SECRET:
        raise ValueError("Credenciais ML não configuradas")
    
    # Recuperar code_verifier armazenado
    code_verifier = None
    if state and state in pkce_codes:
        code_verifier = pkce_codes[state]
        logger.info(f"🔑 Code verifier recuperado para state: {state[:10]}...")
        # Limpar após uso
        del pkce_codes[state]
    else:
        logger.warning(f"⚠️ Code verifier não encontrado para state: {state}")
        # Tentar mesmo assim, talvez o ML não exija sempre
    
    token_url = f"{ML_API_URL}/oauth/token"
    redirect_uri = get_ml_redirect_uri()
    
    data = {
        "grant_type": "authorization_code",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    # Adicionar code_verifier se disponível
    if code_verifier:
        data["code_verifier"] = code_verifier
        logger.info(f"✅ Incluindo code_verifier na requisição")
    
    logger.info(f"🔄 Trocando código por token ML com PKCE...")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            logger.info(f"✅ Token ML obtido com sucesso")
            return token_data
        else:
            error_text = response.text
            error_msg = f"Erro ao obter token ML: {response.status_code} - {error_text}"
            logger.error(f"❌ {error_msg}")
            
            # Log detalhado do erro para debug
            try:
                error_json = response.json()
                logger.error(f"❌ Detalhes do erro ML: {error_json}")
            except:
                logger.error(f"❌ Erro ML (texto): {error_text[:200]}")
            
            raise Exception(error_msg)

async def buscar_produto_ml(ml_id: str, user_id: int = None):
    """Busca produto específico (com ou sem autenticação)"""
    url = f"{ML_API_URL}/items/{ml_id}"
    headers = {}
    
    # Se tiver token do usuário, usar para busca autenticada
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            headers["Authorization"] = f"Bearer {token}"
            logger.info(f"🔑 Usando token ML para buscar produto {ml_id}")
    
    try:
        async with httpx.AsyncClient() as client:
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
                }
            else:
                logger.warning(f"⚠️ Erro ao buscar produto ML {ml_id}: {resp.status_code}")
                return None
    except Exception as e:
        logger.error(f"❌ Erro na busca de produto ML: {e}")
        return None

async def buscar_produtos_ml(query: str, user_id: int = None, limit: int = 20):
    """Busca produtos no Mercado Livre (com ou sem autenticação)"""
    url = f"{ML_API_URL}/sites/MLB/search"
    params = {
        "q": query,
        "limit": limit
    }
    
    # Primeira tentativa: com token (se disponível)
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            try:
                logger.info(f"🔑 Tentando busca autenticada para '{query}'")
                headers = {"Authorization": f"Bearer {token}"}
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.get(url, params=params, headers=headers)
                    
                    if resp.status_code == 200:
                        logger.info(f"✅ Busca ML autenticada bem-sucedida: '{query}'")
                        return resp.json()
                    elif resp.status_code == 401:
                        logger.warning(f"⚠️ Token ML inválido/expirado, tentando busca pública")
                        # Token inválido, remover e tentar busca pública
                        MLTokenManager.revoke_token(user_id)
                    else:
                        logger.warning(f"⚠️ Erro na busca autenticada: {resp.status_code}, tentando busca pública")
            except Exception as e:
                logger.warning(f"⚠️ Erro na busca autenticada: {e}, tentando busca pública")
    
    # Segunda tentativa: busca pública (sempre funciona)
    try:
        logger.info(f"🌐 Tentando busca pública para '{query}'")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, params=params)
            
            if resp.status_code == 200:
                logger.info(f"✅ Busca ML pública bem-sucedida: '{query}'")
                data = resp.json()
                # Adicionar flag indicando que foi busca pública
                data["_search_type"] = "public"
                return data
            else:
                logger.error(f"❌ Erro na busca pública: {resp.status_code}")
                return None
    except Exception as e:
        logger.error(f"❌ Erro na busca pública: {e}")
        return None

async def buscar_avaliacoes_ml(ml_id: str, user_id: int = None):
    """Busca avaliações do produto (com ou sem autenticação)"""
    url = f"{ML_API_URL}/reviews/item/{ml_id}"
    headers = {}
    
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            headers["Authorization"] = f"Bearer {token}"
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                return data.get("reviews", [])
            else:
                logger.warning(f"⚠️ Erro ao buscar avaliações: {resp.status_code}")
                return []
    except Exception as e:
        logger.error(f"❌ Erro ao buscar avaliações: {e}")
        return []

def check_ml_configuration() -> Dict[str, bool]:
    """Verificar se as credenciais ML estão configuradas"""
    return {
        "client_id_configured": bool(ML_CLIENT_ID),
        "client_secret_configured": bool(ML_CLIENT_SECRET),
        "ready_for_oauth": bool(ML_CLIENT_ID and ML_CLIENT_SECRET)
    }

def cleanup_expired_pkce_codes():
    """Limpar códigos PKCE expirados (chamado periodicamente)"""
    # Em uma implementação real, usaria timestamp para expirar
    # Por ora, os códigos são limpos após uso
    pass