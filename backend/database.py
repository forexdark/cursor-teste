import os
import logging
from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from dotenv import load_dotenv

load_dotenv()

# Configurar logging específico para database
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.error("❌ DATABASE_URL não configurada!")
    raise ValueError("DATABASE_URL é obrigatória")

logger.info(f"🔗 Conectando ao banco: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'URL_PARCIAL'}")

# Engine com configurações otimizadas
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,  # 30 minutos
    echo=False  # Não fazer log de todas as queries
)

# Event listener para logs de conexão
@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    logger.info("✅ Nova conexão estabelecida com o banco")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    logger.debug("🔄 Conexão retirada do pool")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_database_connection():
    """Testa a conexão com o banco de dados"""
    try:
        logger.info("🧪 Testando conexão inicial com banco...")
        
        with engine.connect() as connection:
            # Usar text() para queries SQL textuais
            result = connection.execute(text("SELECT 1 as test"))
            test_result = result.fetchone()
            
            if test_result and test_result[0] == 1:
                logger.info("✅ Conexão inicial com banco testada com sucesso")
                return True
            else:
                logger.error("❌ Teste de conexão retornou resultado inesperado")
                return False
                
    except OperationalError as e:
        logger.error(f"❌ Erro operacional no banco: {e}")
        return False
    except SQLAlchemyError as e:
        logger.error(f"❌ Erro SQLAlchemy: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Erro inesperado na conexão: {e}")
        return False

def get_database_info():
    """Obtém informações sobre o banco de dados"""
    try:
        with engine.connect() as connection:
            # Query para obter versão do PostgreSQL
            result = connection.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Banco conectado: {version[:50]}...")
            return version
    except Exception as e:
        logger.error(f"❌ Erro ao obter informações do banco: {e}")
        return None

def create_tables():
    """Cria as tabelas se não existirem"""
    try:
        from models import Base
        logger.info("🔨 Criando/verificando tabelas...")
        
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ Tabelas criadas/verificadas com sucesso")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar tabelas: {e}")
        return False

def get_db():
    """Dependency para obter sessão do banco"""
    db = SessionLocal()
    try:
        # Teste rápido da sessão usando text()
        db.execute(text("SELECT 1"))
        yield db
    except OperationalError as e:
        logger.error(f"❌ Erro de conexão com banco na sessão: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"❌ Erro inesperado na sessão: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def initialize_database():
    """Inicializa o banco de dados completo"""
    logger.info("🚀 Inicializando banco de dados...")
    
    # Teste de conexão
    if not test_database_connection():
        logger.error("❌ Falha na conexão inicial - abortando inicialização")
        return False
    
    # Obter informações do banco
    db_info = get_database_info()
    
    # Criar tabelas
    if not create_tables():
        logger.error("❌ Falha na criação de tabelas")
        return False
    
    logger.info("✅ Banco de dados inicializado com sucesso")
    return True