from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class CustomCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Log todas as requisições CORS
        logger.info(f"🔍 CORS Request: {request.method} {request.url}")
        logger.info(f"🔍 Origin: {request.headers.get('origin', 'No Origin')}")
        
        # Chamar a próxima middleware
        response = await call_next(request)
        
        # Adicionar headers CORS manualmente
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Max-Age"] = "600"
        
        logger.info(f"✅ CORS Response: {response.status_code}")
        return response