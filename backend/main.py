import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import uvicorn
from datetime import datetime, timezone
import logging
from database import initialize_database
import requests

# 🚨 CONFIGURAÇÃO GLOBAL DO REQUESTS - GARANTIR QUE NÃO HÁ HEADERS PADRÃO
# Limpar qualquer configuração global que possa interferir
requests.adapters.DEFAULT_RETRIES = 0  # Desabilitar retries automáticos

# Verificar se não há sessão global configurada
print("🔧 STARTUP: Verificando configuração global do requests...")
default_session = requests.Session()
print(f"🔧 STARTUP: Headers padrão da sessão: {dict(default_session.headers)}")
if default_session.headers:
    print("⚠️ STARTUP: Limpando headers padrão da sessão global...")
    default_session.headers.clear()
print("✅ STARTUP: Sessão requests limpa")

# Carregar variáveis de ambiente
load_dotenv()

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Criar aplicação FastAPI
app = FastAPI(
    title="VigIA Backend", 
    version="1.0.0",
    description="API para monitoramento de preços do Mercado Livre"
)

# Configurar CORS
origins = [
    "https://vigia-meli.vercel.app",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600
)

# Event handlers
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 VigIA Backend iniciando...")
    logger.info(f"📅 Timestamp: {datetime.now(timezone.utc)}")
    logger.info(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}")
    
    # Verificar variáveis essenciais
    database_url = os.getenv('DATABASE_URL')
    ml_client_id = os.getenv('ML_CLIENT_ID')
    
    # Inicializar banco de dados
    if database_url:
        logger.info("🗄️ Iniciando configuração do banco de dados...")
        db_success = initialize_database()
        
        logger.info("🗄️ Database Status:")
        logger.info(f"  - Configurado: {'✅' if database_url else '❌'}")
        logger.info(f"  - Engine: {'✅' if db_success else '❌'}")
        logger.info(f"  - Conexão: {'✅' if db_success else '❌'}")
        logger.info(f"  - Tabelas: {'✅' if db_success else '❌'}")
        logger.info(f"  - Tipo: postgresql")
        
        if not db_success:
            logger.warning("⚠️ Banco configurado mas com problemas - algumas funcionalidades podem falhar")
    else:
        logger.error("❌ DATABASE_URL não configurada - funcionalidades de banco não estarão disponíveis")
    
    logger.info(f"🛒 ML Client: {'✅ Configurado' if ml_client_id else '❌ NÃO CONFIGURADO'}")
    
    if not database_url:
        logger.warning("⚠️ DATABASE_URL não configurada - algumas funcionalidades podem não funcionar")

# Importar e incluir rotas (com tratamento de erro)
try:
    from routers import router
    from mercadolivre import ML_API_URL  # Importar para verificação
    app.include_router(router)
    logger.info("✅ Rotas carregadas com sucesso")
    logger.info(f"🔗 ML API URL configurada: {ML_API_URL}")
except ImportError as e:
    logger.error(f"❌ Erro ao importar rotas: {e}")
    # Criar rotas básicas como fallback
    @app.get("/")
    def root_fallback():
        return {
            "message": "VigIA Backend rodando! 🚀",
            "error": "Algumas rotas podem não estar disponíveis"
        }

# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    logger.warning(f"❌ 404 - Endpoint não encontrado: {request.url}")
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint não encontrado",
            "url": str(request.url),
            "method": request.method,
            "available_endpoints": [
                "GET /",
                "GET /health",
                "POST /auth/register", 
                "POST /auth/login",
                "GET /test/mercadolivre",
                "GET /docs"
            ]
        }
    )

@app.exception_handler(405)
async def method_not_allowed_handler(request, exc):
    logger.warning(f"❌ 405 - Método não permitido: {request.method} {request.url}")
    return JSONResponse(
        status_code=405,
        content={
            "detail": f"Método {request.method} não permitido para este endpoint",
            "url": str(request.url),
            "tip": "Verifique se está usando POST para login/register e GET para busca"
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"❌ 500 - Erro interno: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "message": "Tente novamente em alguns momentos"
        }
    )

# Rotas básicas
@app.get("/")
def root():
    return {
        "message": "VigIA Backend rodando! 🚀",
        "version": "1.0.0",
        "status": "online",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Endpoint de verificação de saúde"""
    try:
        # Verificar conexão com banco
        from database import test_database_connection
        database_status = "ok" if test_database_connection() else "error"
        
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "database": database_status,
            "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
            "cors_origins": origins
        }
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "error", 
                "message": str(e),
                "database": "error"
            }
        )

# Endpoint de diagnóstico
@app.get("/debug/info", summary="Informações de debug e compliance ML 2025")
def debug_info():
    """
    Informações de debug e compliance OAuth 2.0 ML 2025
    (apenas para desenvolvimento)
    """
    return {
        "python_version": sys.version,
        "working_directory": os.getcwd(),
        "ml_oauth_compliance": "2025_OAUTH_2.0_PKCE_REQUIRED",
        "documentation": "https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao",
        "environment_vars": {
            "DATABASE_URL": "✅ Set" if os.getenv('DATABASE_URL') else "❌ Not Set",
            "ML_CLIENT_ID": "✅ Set" if os.getenv('ML_CLIENT_ID') else "❌ Not Set",
            "FRONTEND_URL": os.getenv('FRONTEND_URL', 'Not Set'),
            "PORT": os.getenv('PORT', 'Not Set'),
            "ML_OAUTH_REDIRECT": os.getenv('ML_REDIRECT_URI', 'Default: /api/auth/callback/mercadolivre')
        }
    }

# Para execução local
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)