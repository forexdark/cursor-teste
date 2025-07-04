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
    def save_token(user_id: int, token_data: dict):
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
        
        print(f"🔐 Token OAuth salvo para user {user_id}, expira em {expires_at}")
    
    @staticmethod
    def get_token(user_id: int) -> Optional[str]:
        """Recupera o token válido do usuário"""
        if user_id not in ml_tokens:
            print(f"❌ Token não encontrado para user {user_id}")
            return None
        
        token_info = ml_tokens[user_id]
        
        # Verificar se o token expirou
        if datetime.now() >= token_info["expires_at"]:
            print(f"⏰ Token expirado para user {user_id}, tentando renovar...")
            return MLTokenManager.refresh_token(user_id)
        
        print(f"✅ Token válido para user {user_id}: {token_info['access_token'][:20]}...")
        return token_info["access_token"]
    
    @staticmethod
    def refresh_token(user_id: int) -> Optional[str]:
        """Renova o token OAuth usando refresh_token"""
        if user_id not in ml_tokens:
            print(f"❌ Token não encontrado para renovação: user {user_id}")
            return None
        
        token_info = ml_tokens[user_id]
        refresh_token = token_info.get("refresh_token")
        
        if not refresh_token:
            print(f"❌ Refresh token não disponível para user {user_id}")
            del ml_tokens[user_id]
            return None
        
        # Implementar renovação real do token
        try:
            print(f"🔄 Renovando token para user {user_id}...")
            
            data = {
                "grant_type": "refresh_token",
                "client_id": ML_CLIENT_ID,
                "client_secret": ML_CLIENT_SECRET,
                "refresh_token": refresh_token
            }
            
            import requests
            response = requests.post(f"{ML_API_URL}/oauth/token", data=data, timeout=10)
            
            if response.status_code == 200:
                new_token_data = response.json()
                MLTokenManager.save_token(user_id, new_token_data)
                print(f"✅ Token renovado com sucesso para user {user_id}")
                return new_token_data["access_token"]
            else:
                print(f"❌ Falha na renovação do token: {response.status_code}")
                del ml_tokens[user_id]
                return None
                
        except Exception as e:
            print(f"❌ Erro ao renovar token para user {user_id}: {e}")
            del ml_tokens[user_id]
            return None
    
    @staticmethod
    def revoke_token(user_id: int):
        """Remove o token do usuário"""
        if user_id in ml_tokens:
            del ml_tokens[user_id]
            print(f"🗑️ Token removido para user {user_id}")

async def buscar_produto_ml(ml_id: str, user_id: int):
    """
    🔐 BUSCA PRODUTO ESPECÍFICO - SEMPRE AUTENTICADA
    
    Conforme documentação oficial ML 2025:
    - OBRIGATÓRIO: token OAuth do usuário
    - NUNCA usar endpoints públicos (todos bloqueados)
    """
    if not user_id:
        print(f"❌ ERRO: user_id obrigatório para busca de produto")
        return None
        
    print(f"🔐 BUSCA AUTENTICADA PRODUTO: id={ml_id}, user_id={user_id}")
    
    # Obter token válido do usuário
    token = MLTokenManager.get_token(user_id)
    if not token:
        print(f"❌ Token ML ausente/expirado para user {user_id}")
        return None
    
    url = f"{ML_API_URL}/items/{ml_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "VigIA/1.0"
    }
    
    environment = 'Railway' if 'RAILWAY_STATIC_URL' in os.environ else 'Local'
    print(f"🌐 [PRODUTO DEBUG] Ambiente: {environment}")
    print(f"🔑 [PRODUTO DEBUG] Token: {token[:15]}...")
    print(f"📡 [PRODUTO DEBUG] URL: {url}")
    print(f"📋 [PRODUTO DEBUG] Headers: {list(headers.keys())}")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=15.0)
            
            print(f"🟧 [PRODUTO DEBUG] Status: {resp.status_code}")
            print(f"🟥 [PRODUTO DEBUG] Response: {resp.text[:200]}...")
            
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ Produto autenticado obtido: {data.get('title', 'N/A')[:50]}")
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
                print(f"🔄 Token produto expirado, tentando renovar user {user_id}")
                new_token = MLTokenManager.refresh_token(user_id)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    resp = await client.get(url, headers=headers, timeout=15.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"✅ Produto obtido com token renovado")
                        return {
                            "nome": data.get("title"),
                            "preco": data.get("price"),
                            "estoque": data.get("available_quantity"),
                            "url": data.get("permalink"),
                            "thumbnail": data.get("thumbnail"),
                            "vendedor_id": data.get("seller_id"),
                        }
                
                print(f"❌ Token produto não renovável - nova autorização necessária")
                return None
            else:
                print(f"❌ Erro HTTP busca produto: {resp.status_code}")
                return None
                
    except Exception as e:
        print(f"❌ Erro na busca autenticada de produto: {e}")
        return None

def generate_pkce_pair():
    """Gera code_verifier e code_challenge para PKCE"""
    code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
    digest = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')
    return code_verifier, code_challenge

def get_ml_auth_url(state: str = None) -> str:
    """Gera URL de autorização OAuth do Mercado Livre com PKCE"""
    code_verifier, code_challenge = generate_pkce_pair()
    
    if state and state.startswith('user_'):
        user_id = state.split('_')[1]
        pkce_store[user_id] = code_verifier
        print(f"🔐 PKCE gerado para user {user_id}: verifier={code_verifier[:10]}..., challenge={code_challenge[:10]}...")
    
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
    print(f"🔗 URL OAuth gerada: {auth_url[:100]}...")
    return auth_url

async def exchange_code_for_token(code: str, state: str = None) -> dict:
    """Troca o código OAuth por token de acesso com PKCE"""
    token_url = f"{ML_API_URL}/oauth/token"
    
    code_verifier = None
    if state and state.startswith('user_'):
        user_id = state.split('_')[1]
        code_verifier = pkce_store.get(user_id)
        print(f"🔐 Recuperando verifier para user {user_id}: {code_verifier[:10] if code_verifier else 'NÃO ENCONTRADO'}...")
        
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
        "code_verifier": code_verifier
    }
    
    print(f"🔄 Trocando código OAuth por token...")
    print(f"📋 Dados: grant_type={data['grant_type']}, client_id={data['client_id'][:10]}..., code={code[:10]}...")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(token_url, data=data, timeout=30.0)
            
            print(f"📡 Response status: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"✅ Token OAuth obtido: {list(token_data.keys())}")
                return token_data
            else:
                error_text = response.text
                print(f"❌ Erro {response.status_code}: {error_text}")
                raise Exception(f"Erro ao obter token: {response.status_code} - {error_text}")
                
        except httpx.TimeoutException:
            print("❌ Timeout na requisição OAuth")
            raise Exception("Timeout na comunicação com Mercado Livre")
        except Exception as e:
            print(f"❌ Erro na requisição OAuth: {e}")
            raise

async def buscar_produtos_ml(query: str, user_id: int, limit: int = 20):
    """
    🔐 BUSCA PRODUTOS - SEMPRE AUTENTICADA VIA OAUTH
    
    Conforme documentação oficial ML 2025:
    - OBRIGATÓRIO: token OAuth do usuário
    - NUNCA usar endpoints públicos (todos depreciados/bloqueados)
    - Validar e renovar tokens automaticamente
    """
    if not user_id:
        print(f"❌ ERRO CRÍTICO: user_id obrigatório para busca autenticada")
        return None
        
    print(f"🔐 ML AUTHENTICATED SEARCH: query='{query}', user_id={user_id}, limit={limit}")
    
    # Obter token válido do usuário
    token = MLTokenManager.get_token(user_id)
    if not token:
        print(f"❌ Token ML ausente/expirado para user {user_id} - autorização necessária")
        return None
    
    # URL da API autenticada
    search_url = f"{ML_API_URL}/sites/MLB/search"
    params = {
        "q": query,
        "limit": limit,
        "offset": 0
    }
    
    # Headers obrigatórios com token OAuth
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "VigIA/1.0"
    }
    
    environment = 'Railway' if 'RAILWAY_STATIC_URL' in os.environ else 'Local'
    print(f"🌐 [SEARCH DEBUG] Ambiente: {environment}")
    print(f"🔑 [SEARCH DEBUG] Token: {token[:20]}...")
    print(f"📡 [SEARCH DEBUG] URL: {search_url}")
    print(f"📋 [SEARCH DEBUG] Params: {params}")
    print(f"📤 [SEARCH DEBUG] Headers enviados: {list(headers.keys())}")
    
    try:
        # SEMPRE usar busca autenticada - NUNCA pública
        async with httpx.AsyncClient() as client:
            resp = await client.get(search_url, headers=headers, params=params, timeout=20.0)
            
            print(f"🟧 [SEARCH DEBUG] Status HTTP: {resp.status_code}")
            print(f"🟥 [SEARCH DEBUG] Response length: {len(resp.text)} chars")
            print(f"🟨 [SEARCH DEBUG] Response headers: {dict(resp.headers)}")
            
            if resp.status_code == 200:
                data = resp.json()
                results_count = len(data.get('results', []))
                print(f"✅ Busca autenticada bem-sucedida: {results_count} produtos encontrados")
                
                # Log detalhado do primeiro produto (para debug)
                if results_count > 0:
                    primeiro = data['results'][0]
                    print(f"🔍 Primeiro produto: {primeiro.get('title', 'N/A')[:50]}... - R$ {primeiro.get('price', 0)}")
                
                return data
                
            elif resp.status_code == 401:
                print(f"🔄 Token expirado (401), tentando renovar para user {user_id}")
                
                # Tentar renovar token automaticamente
                new_token = MLTokenManager.refresh_token(user_id)
                if new_token:
                    print(f"✅ Token renovado, repetindo busca...")
                    headers["Authorization"] = f"Bearer {new_token}"
                    
                    # Repetir busca com token renovado
                    resp = await client.get(search_url, headers=headers, params=params, timeout=20.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        print(f"✅ Busca bem-sucedida com token renovado: {len(data.get('results', []))} produtos")
                        return data
                    else:
                        print(f"❌ Busca falhou mesmo com token renovado: {resp.status_code}")
                
                print(f"❌ Token não pôde ser renovado - NOVA AUTORIZAÇÃO OAUTH NECESSÁRIA")
                MLTokenManager.revoke_token(user_id)
                return None
                
            elif resp.status_code == 403:
                print(f"❌ Acesso negado (403) - escopo insuficiente ou app não aprovado")
                print(f"🔍 Response 403: {resp.text[:300]}")
                return None
                
            elif resp.status_code == 429:
                print(f"⏰ Rate limit atingido (429) - aguardar antes de nova tentativa")
                return None
                
            else:
                print(f"❌ Erro HTTP inesperado {resp.status_code}: {resp.text[:300]}")
                return None
                
    except httpx.TimeoutException:
        print(f"⏰ Timeout (20s) na busca autenticada ML")
        return None
    except Exception as e:
        print(f"❌ Erro crítico na busca autenticada ML: {str(e)}")
        import traceback
        print(f"📜 Stacktrace: {traceback.format_exc()}")
        return None

async def buscar_avaliacoes_ml(ml_id: str, user_id: int):
    """
    🔐 BUSCA AVALIAÇÕES - SEMPRE AUTENTICADA
    
    Conforme documentação oficial ML 2025:
    - OBRIGATÓRIO: token OAuth do usuário
    - NUNCA usar endpoints públicos (depreciados)
    """
    if not user_id:
        print(f"❌ ERRO: user_id obrigatório para busca de avaliações")
        return []
        
    print(f"🔐 BUSCA AUTENTICADA AVALIAÇÕES: produto={ml_id}, user_id={user_id}")
    
    # Obter token válido do usuário
    token = MLTokenManager.get_token(user_id)
    if not token:
        print(f"❌ Token ML ausente para avaliações: user {user_id}")
        return []
        
    url = f"{ML_API_URL}/reviews/item/{ml_id}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "User-Agent": "VigIA/1.0"
    }
    
    print(f"🔑 [REVIEWS DEBUG] Token: {token[:15]}...")
    print(f"📡 [REVIEWS DEBUG] URL: {url}")
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, headers=headers, timeout=15.0)
            
            print(f"🟧 [REVIEWS DEBUG] Status: {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                reviews = data.get("reviews", [])
                print(f"✅ Avaliações autenticadas obtidas: {len(reviews)} reviews")
                return reviews
                
            elif resp.status_code == 401:
                print(f"🔄 Token avaliações expirado, renovando...")
                new_token = MLTokenManager.refresh_token(user_id)
                if new_token:
                    headers["Authorization"] = f"Bearer {new_token}"
                    resp = await client.get(url, headers=headers, timeout=15.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        reviews = data.get("reviews", [])
                        print(f"✅ Avaliações obtidas com token renovado: {len(reviews)} reviews")
                        return reviews
                
                print(f"❌ Token avaliações não renovável")
                MLTokenManager.revoke_token(user_id)
                return []
                
            else:
                print(f"❌ Erro ao buscar avaliações: {resp.status_code}")
                print(f"🔍 Response: {resp.text[:200]}")
                return []
                
    except Exception as e:
        print(f"❌ Erro na busca de avaliações: {e}")
        return []