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
    "https://localhost:3000",
    "https://*.vercel.app",
    "*"  # Temporário para debug
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],

# Event handlers
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 VigIA Backend iniciando...")
    logger.info(f"📅 Timestamp: {datetime.now(timezone.utc)}")
    logger.info(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}")
    
    # Verificar variáveis essenciais
    database_url = os.getenv('DATABASE_URL')
    ml_client_id = os.getenv('ML_CLIENT_ID')
    
    logger.info(f"🗄️ Database: {'✅ Configurado' if database_url else '❌ NÃO CONFIGURADO'}")
    logger.info(f"🛒 ML Client: {'✅ Configurado' if ml_client_id else '❌ NÃO CONFIGURADO'}")
    
    if not database_url:
        logger.warning("⚠️ DATABASE_URL não configurada - algumas funcionalidades podem não funcionar")

# Importar e incluir rotas (com tratamento de erro)
try:
    from routers import router
    app.include_router(router)
    logger.info("✅ Rotas carregadas com sucesso")
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
        # Verificar conexão com banco (se disponível)
        database_status = "ok" if os.getenv('DATABASE_URL') else "not_configured"
        
        return {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "database": database_status,
            "environment": os.getenv("RAILWAY_ENVIRONMENT", "development"),
            "cors": "enabled"
        }
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        response = JSONResponse(
            status_code=503,
            content={"status": "error", "message": str(e)}
        )
        # Adicionar headers CORS mesmo em erro
        response.headers.update({
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        })
        return response

# Endpoint de diagnóstico
@app.get("/debug/info")
def debug_info():
    """Informações de debug (apenas para desenvolvimento)"""
    return {
        "python_version": sys.version,
        "working_directory": os.getcwd(),
        "environment_vars": {
            "DATABASE_URL": "✅ Set" if os.getenv('DATABASE_URL') else "❌ Not Set",
            "ML_CLIENT_ID": "✅ Set" if os.getenv('ML_CLIENT_ID') else "❌ Not Set",
            "FRONTEND_URL": os.getenv('FRONTEND_URL', 'Not Set'),
            "PORT": os.getenv('PORT', 'Not Set')
        }
    }

# Para execução local
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)