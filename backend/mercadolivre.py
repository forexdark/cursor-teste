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
ML_REDIRECT_URI = os.getenv("ML_REDIRECT_URI", "https://vigia-meli.vercel.app/api/auth/callback/mercadolivre")

# Armazenamento simples do token (em produção, usar Redis ou banco)
ml_tokens = {}
pkce_store = {}

class MLTokenManager:
    @staticmethod
    def save_token(user_id: int, token_data: dict):
        """
        Armazena o token OAuth do usuário
        Salva no dicionário global ml_tokens
        """
        global ml_tokens
        expires_in = token_data.get("expires_in", 3600)
        expires_at = datetime.now() + timedelta(seconds=expires_in)
        
        ml_tokens[user_id] = {
            "access_token": token_data["access_token"],
            "refresh_token": token_data.get("refresh_token"),
            "expires_at": expires_at,
            "user_id": token_data.get("user_id"),
            "scope": token_data.get("scope"),
            "token_type": "Bearer",
            "saved_at": datetime.now().isoformat()
        }
        
        print(f"🔐 [ML 2025] Token OAuth salvo para user {user_id}, expira em {expires_at}")
        print(f"📋 [ML 2025] Escopos: {token_data.get('scope', 'N/A')}")
        print(f"💾 [ML 2025] Token salvo às: {datetime.now().isoformat()}")
        
        # Verificar se realmente foi salvo
        if user_id in ml_tokens:
            print(f"✅ [ML 2025] Confirmação: Token para user {user_id} está no storage")
        else:
            print(f"❌ [ML 2025] ERRO: Token para user {user_id} NÃO foi salvo!")
    
    @staticmethod
    def get_token(user_id: int) -> Optional[str]:
        """
        Recupera o token válido do usuário
        Busca no dicionário global ml_tokens
        """
        global ml_tokens
        print(f"🔍 [ML 2025] Buscando token para user {user_id}")
        print(f"🗂️ [ML 2025] Tokens salvos: {list(ml_tokens.keys())}")
        print(f"🔍 [ML 2025] ml_tokens object id: {id(ml_tokens)}")
        
        if user_id not in ml_tokens:
            print(f"❌ [ML 2025] Token não encontrado para user {user_id}")
            return None
        
        token_info = ml_tokens[user_id]
        print(f"🔍 [ML 2025] Token encontrado para user {user_id}, salvo às: {token_info.get('saved_at', 'N/A')}")
        
        # Verificar se o token expirou (com margem de 5 minutos)
        if datetime.now() >= (token_info["expires_at"] - timedelta(minutes=5)):
            print(f"⏰ [ML 2025] Token expirando para user {user_id}, tentando renovar...")
            return MLTokenManager.refresh_token(user_id)
        
        print(f"✅ [ML 2025] Token válido para user {user_id}: {token_info['access_token'][:20]}...")
        return token_info["access_token"]
    
    @staticmethod
    def refresh_token(user_id: int) -> Optional[str]:
        """
        Renova o token OAuth usando refresh_token
        Atualiza no dicionário global ml_tokens
        """
        global ml_tokens
        if user_id not in ml_tokens:
            print(f"❌ [ML 2025] Token não encontrado para renovação: user {user_id}")
            return None
        
        token_info = ml_tokens[user_id]
        refresh_token = token_info.get("refresh_token")
        
        if not refresh_token:
            print(f"❌ [ML 2025] Refresh token não disponível para user {user_id}")
            del ml_tokens[user_id]
            return None
        
        try:
            print(f"🔄 [ML 2025] Renovando token para user {user_id}...")
            
            data = {
                "grant_type": "refresh_token",
                "client_id": ML_CLIENT_ID,
                "client_secret": ML_CLIENT_SECRET,
                "refresh_token": refresh_token
            }
            
            import requests
            response = requests.post(f"{ML_API_URL}/oauth/token", data=data, timeout=15)
            
            if response.status_code == 200:
                new_token_data = response.json()
                MLTokenManager.save_token(user_id, new_token_data)
                print(f"✅ [ML 2025] Token renovado com sucesso para user {user_id}")
                return new_token_data["access_token"]
            else:
                print(f"❌ [ML 2025] Falha na renovação do token: {response.status_code}")
                print(f"📄 [ML 2025] Response: {response.text}")
                del ml_tokens[user_id]
                return None
                
        except Exception as e:
            print(f"❌ [ML 2025] Erro ao renovar token para user {user_id}: {e}")
            del ml_tokens[user_id]
            return None
    
    @staticmethod
    def revoke_token(user_id: int):
        """
        Remove o token do usuário
        Remove do dicionário global ml_tokens
        """
        global ml_tokens
        if user_id in ml_tokens:
            del ml_tokens[user_id]
            print(f"🗑️ [ML 2025] Token removido para user {user_id}")

def generate_pkce_pair():
    """Gera code_verifier e code_challenge para PKCE"""
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    return code_verifier, code_challenge

def get_ml_auth_url(state: str = None) -> str:
    """
    Gera URL de autorização OAuth do Mercado Livre com PKCE
    Conforme: https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
    """
    code_verifier, code_challenge = generate_pkce_pair()
    
    if state and state.startswith('user_'):
        user_id = state.split('_')[1]
        pkce_store[user_id] = code_verifier
        print(f"🔐 [ML 2025] PKCE gerado para user {user_id}: challenge={code_challenge[:10]}...")
    
    # Parâmetros conforme documentação oficial ML 2025
    params = {
        "response_type": "code",
        "client_id": ML_CLIENT_ID,
        "redirect_uri": ML_REDIRECT_URI,
        "scope": "read write offline_access",  # Escopos conforme documentação oficial 2025
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "access_type": "offline"  # Para receber refresh_token
    }
    
    if state:
        params["state"] = state
    
    auth_url = f"https://auth.mercadolivre.com.br/authorization?{urlencode(params)}"
    print(f"🔗 [ML 2025] URL autorização OAuth 2.0 + PKCE: {auth_url[:100]}...")
    print(f"🔑 [ML 2025] Escopos: read write offline_access")
    print(f"📍 [ML 2025] Redirect: {ML_REDIRECT_URI}")
    return auth_url

async def exchange_code_for_token(code: str, state: str = None) -> dict:
    """
    Troca o código OAuth por token de acesso com PKCE
    Conforme: https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
    """
    token_url = f"{ML_API_URL}/oauth/token"
    
    code_verifier = None
    if state and state.startswith('user_'):
        user_id = state.split('_')[1]
        code_verifier = pkce_store.get(user_id)
        print(f"🔐 [ML 2025] Recuperando PKCE verifier para user {user_id}")
        
        if code_verifier:
            del pkce_store[user_id]
    
    if not code_verifier:
        print("❌ [ML 2025] PKCE code_verifier não encontrado!")
        raise Exception("PKCE code_verifier não encontrado. Tente autorizar novamente.")
    
    # Dados conforme documentação oficial
    data = {
        "grant_type": "authorization_code",
        "client_id": ML_CLIENT_ID,
        "client_secret": ML_CLIENT_SECRET,
        "code": code,
        "redirect_uri": ML_REDIRECT_URI,
        "code_verifier": code_verifier
    }
    
    print(f"🔄 [ML 2025] Trocando código OAuth por token...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=data, timeout=30.0)
            
            print(f"📡 [ML 2025] Token response status: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"✅ [ML 2025] Token OAuth obtido: {list(token_data.keys())}")
                return token_data
            else:
                error_text = response.text
                print(f"❌ [ML 2025] Erro {response.status_code}: {error_text}")
                raise Exception(f"Erro ao obter token: {response.status_code} - {error_text}")
                
        except httpx.TimeoutException:
            print("❌ [ML 2025] Timeout na requisição OAuth")
            raise Exception("Timeout na comunicação com Mercado Livre")
        except Exception as e:
            print(f"❌ [ML 2025] Erro na requisição OAuth: {e}")
            raise

async def buscar_produtos_ml(query: str, user_id: int, limit: int = 20):
    """
    🔐 BUSCA PRODUTOS - OAuth 2.0 + PKCE obrigatório
    
    Conforme documentação oficial ML 2025:
    https://developers.mercadolivre.com.br/pt_br/itens-e-buscas
    https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
    
    - OBRIGATÓRIO: token OAuth do usuário
    - Endpoint: /sites/MLB/search
    - Headers: Authorization Bearer
    - Escopos: read write offline_access
    """
    if not user_id:
        print(f"❌ [ML 2025] ERRO: user_id obrigatório para busca autenticada")
        return None
        
    print(f"🔍 [ML 2025] BUSCA AUTENTICADA: query='{query}', user_id={user_id}, limit={limit}")
    
    # Obter token válido do usuário
    token = MLTokenManager.get_token(user_id)
    if not token:
        print(f"❌ [ML 2025] Token OAuth ausente/expirado para user {user_id}")
        return None
    
    # URL oficial conforme documentação de itens e buscas
    search_url = f"{ML_API_URL}/sites/MLB/search"
    params = {
        "q": query,
        "limit": limit,
        "offset": 0
    }
    
    # Headers conforme documentação de autenticação
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "VigIA/1.0"
    }
    
    environment = 'Railway' if 'RAILWAY_STATIC_URL' in os.environ else 'Local'
    print(f"🌐 [ML 2025] Ambiente: {environment}")
    print(f"🔑 [ML 2025] Token: {token[:20]}...")
    print(f"📡 [ML 2025] URL: {search_url}")
    print(f"📋 [ML 2025] Params: {params}")
    print(f"📤 [ML 2025] Headers: Authorization Bearer (presente)")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(search_url, headers=headers, params=params, timeout=25.0)
            
            print(f"📊 [ML 2025] Status HTTP: {resp.status_code}")
            print(f"📄 [ML 2025] Response headers: {dict(resp.headers).get('content-type', 'N/A')}")
            
            if resp.status_code == 200:
                data = resp.json()
                results_count = len(data.get('results', []))
                total_available = data.get('paging', {}).get('total', 0)
                
                print(f"✅ [ML 2025] Busca bem-sucedida: {results_count} produtos retornados")
                print(f"📊 [ML 2025] Total disponível: {total_available}")
                
                # Log do primeiro produto para debug
                if results_count > 0:
                    primeiro = data['results'][0]
                    print(f"🔍 [ML 2025] Exemplo: {primeiro.get('title', 'N/A')[:50]}... - R$ {primeiro.get('price', 0)}")
                
                return data
                
            elif resp.status_code == 401:
                print(f"🔄 [ML 2025] Token expirado (401), tentando renovar para user {user_id}")
                
                # Tentar renovar token automaticamente
                new_token = MLTokenManager.refresh_token(user_id)
                if new_token:
                    print(f"✅ [ML 2025] Token renovado, repetindo busca...")
                    headers["Authorization"] = f"Bearer {new_token}"
                    
                    # Repetir busca com token renovado
                    resp = await client.get(search_url, headers=headers, params=params, timeout=25.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"✅ [ML 2025] Busca bem-sucedida com token renovado: {len(data.get('results', []))} produtos")
                        return data
                    else:
                        print(f"❌ [ML 2025] Busca falhou mesmo com token renovado: {resp.status_code}")
                
                print(f"❌ [ML 2025] Token não pôde ser renovado - NOVA AUTORIZAÇÃO OAUTH NECESSÁRIA")
                MLTokenManager.revoke_token(user_id)
                return None
                
            elif resp.status_code == 403:
                print(f"❌ [ML 2025] Acesso negado (403) - verificar escopos ou app não aprovado")
                print(f"📄 [ML 2025] Response 403: {resp.text[:300]}")
                return None
                
            elif resp.status_code == 429:
                print(f"⏰ [ML 2025] Rate limit atingido (429)")
                print(f"📄 [ML 2025] Response: {resp.text[:300]}")
                return None
                
            else:
                print(f"❌ [ML 2025] Erro HTTP inesperado {resp.status_code}")
                print(f"📄 [ML 2025] Response: {resp.text[:300]}")
                return None
                
    except httpx.TimeoutException:
        print(f"⏰ [ML 2025] Timeout (25s) na busca")
        return None
    except Exception as e:
        print(f"❌ [ML 2025] Erro crítico na busca: {str(e)}")
        import traceback
        print(f"📜 [ML 2025] Stacktrace: {traceback.format_exc()}")
        return None

async def buscar_produto_ml(ml_id: str, user_id: int):
    """
    🔐 BUSCA PRODUTO ESPECÍFICO - OAuth 2.0 + PKCE obrigatório
    
    Conforme documentação oficial ML 2025:
    https://developers.mercadolivre.com.br/pt_br/itens-e-buscas
    https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
    
    - OBRIGATÓRIO: token OAuth do usuário
    - Endpoint: /items/{id}
    - Headers: Authorization Bearer
    """
    if not user_id:
        print(f"❌ [ML 2025] ERRO: user_id obrigatório para busca de produto")
        return None
        
    print(f"🔐 [ML 2025] BUSCA PRODUTO: id={ml_id}, user_id={user_id}")
    
    # Obter token válido do usuário
    token = MLTokenManager.get_token(user_id)
    if not token:
        print(f"❌ [ML 2025] Token OAuth ausente/expirado para user {user_id}")
        return None
    
    url = f"{ML_API_URL}/items/{ml_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "VigIA/1.0"
    }
    
    print(f"📡 [ML 2025] URL: {url}")
    print(f"🔑 [ML 2025] Token: {token[:15]}...")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=15.0)
            
            print(f"📊 [ML 2025] Status: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ [ML 2025] Produto obtido: {data.get('title', 'N/A')[:50]}")
                return {
                    "nome": data.get("title"),
                    "preco": data.get("price"),
                    "estoque": data.get("available_quantity"),
                    "url": data.get("permalink"),
                    "thumbnail": data.get("thumbnail"),
                    "vendedor_id": data.get("seller_id"),
                    "condition": data.get("condition"),
                    "currency_id": data.get("currency_id")
                }
            elif resp.status_code == 401:
                print(f"🔄 [ML 2025] Token produto expirado, tentando renovar...")
                new_token = MLTokenManager.refresh_token(user_id)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    resp = await client.get(url, headers=headers, timeout=15.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"✅ [ML 2025] Produto obtido com token renovado")
                        return {
                            "nome": data.get("title"),
                            "preco": data.get("price"),
                            "estoque": data.get("available_quantity"),
                            "url": data.get("permalink"),
                            "thumbnail": data.get("thumbnail"),
                            "vendedor_id": data.get("seller_id"),
                        }
                
                print(f"❌ [ML 2025] Token não renovável")
                return None
            else:
                print(f"❌ [ML 2025] Erro HTTP busca produto: {resp.status_code}")
                print(f"📄 [ML 2025] Response: {resp.text[:200]}")
                return None
                
    except Exception as e:
        print(f"❌ [ML 2025] Erro na busca de produto: {e}")
        return None

async def buscar_avaliacoes_ml(ml_id: str, user_id: int):
    """
    🔐 BUSCA AVALIAÇÕES - OAuth 2.0 + PKCE obrigatório
    
    Conforme documentação oficial ML 2025
    """
    if not user_id:
        print(f"❌ [ML 2025] ERRO: user_id obrigatório para busca de avaliações")
        return []
        
    print(f"🔐 [ML 2025] BUSCA AVALIAÇÕES: produto={ml_id}, user_id={user_id}")
    
    # Obter token válido do usuário
    token = MLTokenManager.get_token(user_id)
    if not token:
        print(f"❌ [ML 2025] Token ML ausente para avaliações: user {user_id}")
        return []
        
    url = f"{ML_API_URL}/reviews/item/{ml_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "VigIA/1.0"
    }
    
    print(f"📡 [ML 2025] URL: {url}")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=15.0)
            
            print(f"📊 [ML 2025] Status: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                reviews = data.get("reviews", [])
                print(f"✅ [ML 2025] Avaliações obtidas: {len(reviews)} reviews")
                return reviews
                
            elif resp.status_code == 401:
                print(f"🔄 [ML 2025] Token avaliações expirado, renovando...")
                new_token = MLTokenManager.refresh_token(user_id)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    resp = await client.get(url, headers=headers, timeout=15.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        reviews = data.get("reviews", [])
                        print(f"✅ [ML 2025] Avaliações obtidas com token renovado: {len(reviews)} reviews")
                        return reviews
                
                print(f"❌ [ML 2025] Token avaliações não renovável")
                MLTokenManager.revoke_token(user_id)
                return []
                
            else:
                print(f"❌ [ML 2025] Erro ao buscar avaliações: {resp.status_code}")
                print(f"📄 [ML 2025] Response: {resp.text[:200]}")
                return []
                
    except Exception as e:
        print(f"❌ [ML 2025] Erro na busca de avaliações: {e}")
        return []