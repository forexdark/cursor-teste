import os
import httpx
from datetime import datetime, timedelta
from typing import Optional

ML_API_URL = "https://api.mercadolibre.com"
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")
ML_REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "https://vigia-meli.vercel.app/auth/mercadolivre/callback")

# Armazenamento simples do token (em produção, usar Redis ou banco)
ml_tokens = {}

class MLTokenManager:
    @staticmethod
    def save_token(user_id: int, token_data: dict):
        """Salva o token OAuth do usuário"""
        ml_tokens[user_id] = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_at": datetime.now() + timedelta(seconds=token_data.get("expires_in", 21600)),
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope")
        }
    
    @staticmethod
    def get_token(user_id: int) -> Optional[str]:
        """Recupera o token válido do usuário"""
        if user_id not in ml_tokens:
            return None
        
        token_info = ml_tokens[user_id]
        
        # Verificar se o token expirou
        if datetime.now() >= token_info["expires_at"]:
            # Token expirado, tentar renovar
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
            return None
        
        # TODO: Implementar refresh do token
        # Por enquanto, remover token expirado
        del ml_tokens[user_id]
        return None
    
    @staticmethod
    def revoke_token(user_id: int):
        """Remove o token do usuário"""
        if user_id in ml_tokens:
            del ml_tokens[user_id]

def get_ml_auth_url(state: str = None) -> str:
    """Gera URL de autorização OAuth do Mercado Livre"""
    base_url = "https://auth.mercadolivre.com.br/authorization"
    params = {
        "response_type": "code",
        "client_id": ML_CLIENT_ID,
        "redirect_uri": ML_REDIRECT_URI,
        "scope": "read write offline_access"
    }
    
    if state:
        params["state"] = state
    
    query_params = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{base_url}?{query_params}"

async def exchange_code_for_token(code: str) -> dict:
    """Troca o código OAuth por token de acesso"""
    token_url = f"{ML_API_URL}/oauth/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "code": code,
        "redirect_uri": ML_REDIRECT_URI
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(token_url, data=data)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Erro ao obter token: {response.status_code} - {response.text}")

async def buscar_produto_ml(ml_id: str, user_id: int = None):
    """Busca produto específico (com ou sem autenticação)"""
    url = f"{ML_API_URL}/items/{ml_id}"
    headers = {}
    
    # Se tiver token do usuário, usar para busca autenticada
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            headers["Authorization"] = f"Bearer {token}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return {
            "nome": data.get("title"),
            "preco": data.get("price"),
            "estoque": data.get("available_quantity"),
            "url": data.get("permalink"),
            "thumbnail": data.get("thumbnail"),
            "vendedor_id": data.get("seller_id"),
        }

async def buscar_produtos_ml(query: str, user_id: int = None, limit: int = 20):
    """Busca produtos no Mercado Livre"""
    url = f"{ML_API_URL}/sites/MLB/search"
    params = {
        "q": query,
        "limit": limit
    }
    headers = {}
    
    # Se tiver token do usuário, usar para busca autenticada
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            headers["Authorization"] = f"Bearer {token}"
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                return resp.json()
            else:
                # Se busca autenticada falhar, tentar sem autenticação
                if headers and resp.status_code == 401:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        return resp.json()
                return None
    except Exception as e:
        print(f"Erro na busca ML: {e}")
        return None

async def buscar_avaliacoes_ml(ml_id: str, user_id: int = None):
    """Busca avaliações do produto (com ou sem autenticação)"""
    url = f"{ML_API_URL}/reviews/item/{ml_id}"
    headers = {}
    
    if user_id:
        token = MLTokenManager.get_token(user_id)
        if token:
            headers["Authorization"] = f"Bearer {token}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            return None
        data = resp.json()
        return data.get("reviews", [])