import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from routers import router
import uvicorn
from scheduler import start_scheduler
from datetime import datetime, timezone
import logging

load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VigIA Backend", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 VigIA Backend iniciando...")
    logger.info(f"📅 Timestamp: {datetime.now(timezone.utc)}")
    logger.info(f"🌐 Frontend URL: {os.getenv('FRONTEND_URL', 'http://localhost:3000')}")
    logger.info(f"🗄️ Database URL: {'Configurado' if os.getenv('DATABASE_URL') else 'NÃO CONFIGURADO'}")
    logger.info(f"🛒 ML Client ID: {'Configurado' if os.getenv('ML_CLIENT_ID') else 'NÃO CONFIGURADO'}")

# CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

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
                "GET /health",
                "POST /auth/register", 
                "POST /auth/login",
                "GET /test/mercadolivre",
                "GET /produtos/search/{query}",
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
def health():