import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError, DisconnectionError
import logging
import time

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ DATABASE_URL não configurada!")
    raise ValueError("DATABASE_URL é obrigatória")

# Corrigir URL do Supabase se necessário
if "xzablodedbvaznrfupqz" in DATABASE_URL:
    # URL incorreta detectada - corrigir
    corrected_url = DATABASE_URL.replace(
        "xzablodedbvaznrfupqz", 
        "xzabloededbvaznttupqz"
    )
    logger.warning(f"🔧 Corrigindo URL do banco: {DATABASE_URL[:50]}... -> {corrected_url[:50]}...")
    DATABASE_URL = corrected_url

try:
    # Configurações otimizadas para Railway + Supabase
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=3600,
        pool_pre_ping=True,  # Importante para detectar conexões mortas
        connect_args={
            "connect_timeout": 10,
            "application_name": "vigia-backend"
        }
    )
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("✅ Engine do banco de dados criada com sucesso")
    
    # Testar conexão inicial
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        logger.info("✅ Conexão inicial com banco testada com sucesso")
        
except Exception as e:
    logger.error(f"❌ Erro ao criar engine do banco: {e}")
    raise

def get_db():
    db = SessionLocal()
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Testar conexão com timeout
            db.execute(text("SELECT 1"))
            yield db
            return
        except (OperationalError, DisconnectionError) as e:
            retry_count += 1
            logger.warning(f"⚠️ Erro de conexão (tentativa {retry_count}/{max_retries}): {e}")
            
            if retry_count < max_retries:
                # Fechar conexão atual e tentar reconectar
                db.close()
                time.sleep(1)  # Aguardar 1 segundo antes de tentar novamente
                db = SessionLocal()
            else:
                logger.error(f"❌ Falha na conexão após {max_retries} tentativas")
                db.rollback()
                raise
        except Exception as e:
            logger.error(f"❌ Erro geral no banco: {e}")
            db.rollback()
            raise
        finally:
            if retry_count >= max_retries or 'e' not in locals():
                db.close()

def test_database_connection():
    """Função para testar a conexão com o banco"""
    try:
        db = SessionLocal()
        db.execute(text("SELECT version()"))
        db.close()
        return True
    except Exception as e:
        logger.error(f"❌ Teste de conexão falhou: {e}")
        return False