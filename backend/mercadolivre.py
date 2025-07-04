import os
import httpx
import base64
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

ML_API_URL = "https://api.mercadolibre.com"
ML_CLIENT_ID = os.getenv("ML_CLIENT_ID")
ML_CLIENT_SECRET = os.getenv("ML_CLIENT_SECRET")
ML_REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "https://vigia-meli.vercel.app/auth/mercadolivre/callback")

# Armazenamento simples do token (em produção, usar Redis ou banco)
ml_tokens = {}
pkce_store = {}

class MLTokenManager:
    @staticmethod
    def store_token(user_id: int, token_data: dict):
        """Armazena o token OAuth do usuário"""
        expires_in = token_data.get("expires_in", 3600)
        expires_at = datetime.now() + timedelta(seconds=expires_in)
        
        ml_tokens[user_id] = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_at": expires_at,
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope")
        }
        
        print(f"🔐 Token armazenado para user {user_id}, expira em {expires_at}")

async def buscar_produto_ml(ml_id: str, user_id: int = None):
    """
    Busca produto específico conforme documentação oficial ML
    Suporta busca pública e autenticada
    """
    url = f"{ML_API_URL}/items/{ml_id}"
    
    print(f"🔍 Buscando produto {ml_id}, user_id={user_id}")
    
    if user_id:
        # Tentar busca autenticada primeiro
        token = MLTokenManager.get_token(user_id)
        if token:
            print(f"🔐 Tentando busca autenticada")
            try:
                async with httpx.AsyncClient() as client:
                    headers = {"Authorization": f"Bearer {token}"}
                    resp = await client.get(url, headers=headers, timeout=10.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"✅ Busca autenticada bem-sucedida")
                        return {
                            "nome": data.get("title"),
                            "preco": data.get("price"),
                            "estoque": data.get("available_quantity"),
                            "url": data.get("permalink"),
                            "thumbnail": data.get("thumbnail"),
                            "vendedor_id": data.get("seller_id"),
                        }
                    print(f"⚠️ Busca autenticada falhou: {resp.status_code}")
            except Exception as e:
                print(f"⚠️ Erro na busca autenticada: {e}")
    
    # Busca pública como fallback
    print(f"🌐 Fazendo busca pública do produto")
    try:
        import requests
        # Busca pública sem headers
        resp = requests.get(url)
        print(f"📊 Status busca pública: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Busca pública bem-sucedida")
            return {
                "nome": data.get("title"),
                "preco": data.get("price"),
                "estoque": data.get("available_quantity"),
                "url": data.get("permalink"),
                "thumbnail": data.get("thumbnail"),
                "vendedor_id": data.get("seller_id"),
            }
        else:
            print(f"❌ Busca pública falhou: {resp.status_code}")
            return None
    except Exception as e:
        print(f"❌ Erro na busca pública: {e}")
        return None
    
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

def generate_pkce_pair():
    """Gera code_verifier e code_challenge para PKCE"""
    # Gerar code_verifier (43-128 caracteres)
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    
    # Gerar code_challenge (SHA256 do verifier)
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    
    return code_verifier, code_challenge

def get_ml_auth_url(state: str = None) -> str:
    """Gera URL de autorização OAuth do Mercado Livre com PKCE"""
    
    # Gerar PKCE
    code_verifier, code_challenge = generate_pkce_pair()
    
    # Usar user_id do state para salvar o verifier
    if state and state.startswith('user_'):
        user_id = state.split('_')[1]
        pkce_store[user_id] = code_verifier
        print(f"🔐 PKCE gerado para user {user_id}: verifier={code_verifier[:10]}..., challenge={code_challenge[:10]}...")
    
    # Parâmetros OAuth com PKCE
    params = {
        "response_type": "code",
        "client_id": ML_CLIENT_ID,
        "redirect_uri": ML_REDIRECT_URI,
        "scope": "read write offline_access",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256"
    }
    
    if state:
        params["state"] = state
    
    auth_url = f"https://auth.mercadolivre.com.br/authorization?{urlencode(params)}"
    print(f"🔗 URL de autorização gerada: {auth_url[:100]}...")
    
    return auth_url

async def exchange_code_for_token(code: str, state: str = None) -> dict:
    """Troca o código OAuth por token de acesso com PKCE"""
    token_url = f"{ML_API_URL}/oauth/token"
    
    # Recuperar code_verifier do state
    code_verifier = None
    if state and state.startswith('user_'):
        user_id = state.split('_')[1]
        code_verifier = pkce_store.get(user_id)
        print(f"🔐 Recuperando verifier para user {user_id}: {code_verifier[:10] if code_verifier else 'NÃO ENCONTRADO'}...")
        
        # Limpar o verifier após uso
        if code_verifier:
            del pkce_store[user_id]
    
    if not code_verifier:
        print("❌ code_verifier não encontrado!")
        raise Exception("code_verifier não encontrado. Tente autorizar novamente.")
    
    data = {
        "grant_type": "authorization_code",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "code": code,
        "redirect_uri": ML_REDIRECT_URI,
        "code_verifier": code_verifier  # PKCE obrigatório
    }
    
    print(f"🔄 Trocando código por token...")
    print(f"📋 Dados: grant_type={data['grant_type']}, client_id={data['client_id'][:10]}..., code={code[:10]}..., verifier={code_verifier[:10]}...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=data, timeout=30.0)
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"✅ Token obtido com sucesso: {list(token_data.keys())}")
                return token_data
            else:
                error_text = response.text
                print(f"❌ Erro {response.status_code}: {error_text}")
                raise Exception(f"Erro ao obter token: {response.status_code} - {error_text}")
                
        except httpx.TimeoutException:
            print("❌ Timeout na requisição")
            raise Exception("Timeout na comunicação com Mercado Livre")
        except Exception as e:
            print(f"❌ Erro na requisição: {e}")
            raise

async def buscar_produtos_ml(query: str, user_id: int = None, limit: int = 20):
    """
    🚨 BUSCA MERCADO LIVRE - API PÚBLICA SEM HEADERS
    
    API pública do ML rejeita qualquer header extra.
    Usar apenas requests.get(url) puro para busca pública.
    """
    print(f"🔍 ML SEARCH: query='{query}', user_id={user_id}")
    
    # URL para busca pública (sem autenticação)
    search_url = f"{ML_API_URL}/sites/MLB/search"
    params = {
        "q": query,
        "limit": limit,
        "site_id": "MLB"
    }
    
    try:
        # Tentar busca autenticada primeiro (se tiver token válido)
        if user_id:
            token = MLTokenManager.get_token(user_id)
            if token:
                print(f"🔐 Busca autenticada para user {user_id}")
                async with httpx.AsyncClient() as client:
                    headers = {"Authorization": f"Bearer {token}"}
                    resp = await client.get(search_url, headers=headers, params=params, timeout=10.0)
                    if resp.status_code == 200:
                        print(f"✅ Busca autenticada bem-sucedida")
                        return resp.json()
                    print(f"⚠️ Busca autenticada falhou ({resp.status_code}), tentando busca pública")
        
        # Busca pública - SEM HEADERS, SEM PARÂMETROS EXTRAS
        print(f"🌐 Busca pública - requests puro sem headers")
        import requests
        
        # Construir URL completa (a API pública prefere URL completa vs params)
        public_url = f"{ML_API_URL}/sites/MLB/search?q={query}&limit={limit}"
        print(f"📡 URL: {public_url}")
        
        # 🚨 CRÍTICO: ZERO headers, ZERO configurações extras
        resp = requests.get(public_url)
        
        print(f"📊 Status público: {resp.status_code}")
        
        if resp.status_code == 200:
            print(f"✅ Busca pública bem-sucedida")
            return resp.json()
        else:
            print(f"❌ Busca pública falhou: {resp.status_code} - {resp.text[:200]}")
            return None
            
    except Exception as e:
        print(f"❌ Erro geral na busca ML: {str(e)}")
        return None

async def buscar_avaliacoes_ml(ml_id: str, user_id: int = None):
    """
    Busca avaliações do produto conforme documentação oficial ML
    Endpoint de reviews é público mas pode usar autenticação para mais dados
    """
    url = f"{ML_API_URL}/reviews/item/{ml_id}"
    
    print(f"🔍 Buscando avaliações de {ml_id}")
    
    if user_id:
        # Tentar busca autenticada para mais detalhes
        token = MLTokenManager.get_token(user_id)
        if token:
            try:
                print(f"🔐 Tentando busca autenticada de avaliações")
                async with httpx.AsyncClient() as client:
                    headers = {"Authorization": f"Bearer {token}"}
                    resp = await client.get(url, headers=headers, timeout=10.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"✅ Avaliações autenticadas obtidas")
                        return data.get("reviews", [])
                    print(f"⚠️ Busca autenticada de avaliações falhou: {resp.status_code}")
            except Exception as e:
                print(f"⚠️ Erro na busca autenticada de avaliações: {e}")
    
    # Busca pública de avaliações
    print(f"🌐 Fazendo busca pública de avaliações")
    try:
        import requests
        # Endpoint de reviews pode ser público
        resp = requests.get(url)
        print(f"📊 Status avaliações públicas: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ Avaliações públicas obtidas")
            return data.get("reviews", [])
        else:
            print(f"❌ Busca pública de avaliações falhou: {resp.status_code}")
            return []
    except Exception as e:
        print(f"❌ Erro na busca pública de avaliações: {e}")
        return []