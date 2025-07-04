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

# Carregar variáveis de ambiente primeiro
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

# Configurar CORS CORRETAMENTE
origins = [
    "https://vigia-meli.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "").strip(),
]

# Remover URLs vazias e duplicadas
origins = list(set([url for url in origins if url]))

logger.info(f"🌐 CORS Origins: {origins}")

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
    logger.info(f"🌐 CORS Origins: {origins}")
    
    # Verificar e configurar banco de dados
    try:
        from database import get_database_status, create_tables
        db_status = get_database_status()
        
        logger.info(f"🗄️ Database Status:")
        logger.info(f"  - Configurado: {'✅' if db_status['configured'] else '❌'}")
        logger.info(f"  - Engine: {'✅' if db_status['engine_created'] else '❌'}")
        logger.info(f"  - Conexão: {'✅' if db_status['connection_test'] else '❌'}")
        logger.info(f"  - Tabelas: {'✅' if db_status['tables_created'] else '❌'}")
        logger.info(f"  - Tipo: {db_status['database_type']}")
        
        if not db_status['configured']:
            logger.warning("⚠️ DATABASE_URL não configurada")
            logger.info("💡 Para usar PostgreSQL do Railway:")
            logger.info("   1. Adicione PostgreSQL plugin no Railway")
            logger.info("   2. Use a DATABASE_URL gerada automaticamente")
        
    except Exception as e:
        logger.error(f"❌ Erro na inicialização do banco: {e}")
    
    # Verificar outras variáveis
    ml_client_id = os.getenv('ML_CLIENT_ID')
    logger.info(f"🛒 ML Client: {'✅ Configurado' if ml_client_id else '❌ NÃO CONFIGURADO'}")

# Importar e incluir rotas com tratamento de erro
try:
    from routers import router
    app.include_router(router)
    logger.info("✅ Rotas carregadas com sucesso")
except ImportError as e:
    logger.error(f"❌ Erro ao importar rotas: {e}")
    
    # Criar rotas básicas como fallback
    @app.get("/fallback")
    def fallback_route():
        return {
            "message": "VigIA Backend rodando em modo limitado",
            "error": "Algumas funcionalidades podem não estar disponíveis",
            "status": "partial"
        }

# Exception handlers melhorados
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint não encontrado",
            "url": str(request.url),
            "method": request.method,
            "available_endpoints": [
                "GET /",
                "GET /health", 
                "GET /test/database",
                "GET /docs"
            ]
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"❌ 500 - Erro interno: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "message": "Tente novamente em alguns momentos",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )

# Rotas básicas sempre disponíveis
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
    """Health check com verificação completa"""
    try:
        # Status básico
        health_status = {
            "status": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
            "environment": os.getenv("RAILWAY_ENVIRONMENT", "development")
        }
        
        # Verificar banco se disponível
        try:
            from database import get_database_status
            db_status = get_database_status()
            health_status["database"] = db_status
        except Exception as e:
            health_status["database"] = {"error": str(e)[:100]}
        
        # Se banco estiver com problema, retornar 503
        if health_status.get("database", {}).get("connection_test") is False:
            return JSONResponse(
                status_code=503,
                content={**health_status, "status": "degraded"}
            )
        
        return health_status
        
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "error", 
                "message": str(e)[:100],
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

@app.get("/test/database")
def test_database_endpoint():
    """Endpoint específico para testar banco"""
    try:
        from database import get_database_status, test_database_connection
        
        # Status detalhado
        status = get_database_status()
        
        # Teste adicional de conexão
        connection_ok = test_database_connection()
        
        return {
            "database_configured": status["configured"],
            "engine_created": status["engine_created"], 
            "connection_test": connection_ok,
            "tables_ready": status["tables_created"],
            "database_type": status["database_type"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "✅ Banco funcionando" if connection_ok else "❌ Problema no banco"
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "error": str(e)[:100],
                "database_configured": False,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

# Para execução local
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)