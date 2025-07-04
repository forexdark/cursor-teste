import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        # Testar conexão - CORRIGIDO com text()
        db.execute(text("SELECT 1"))
        yield db
    except OperationalError as e:
        print(f"❌ Erro de conexão com banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()