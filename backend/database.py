import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError
import logging

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ DATABASE_URL não configurada!")
    raise ValueError("DATABASE_URL é obrigatória")

try:
    engine = create_engine(DATABASE_URL, echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("✅ Engine do banco de dados criada com sucesso")
except Exception as e:
    logger.error(f"❌ Erro ao criar engine do banco: {e}")
    raise

def get_db():
    db = SessionLocal()
    try:
        # Testar conexão - CORRIGIDO com text()
        db.execute(text("SELECT 1"))
        yield db
    except OperationalError as e:
        logger.error(f"❌ Erro de conexão com banco: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"❌ Erro geral no banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()