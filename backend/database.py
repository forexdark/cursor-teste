import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import QueuePool
from dotenv import load_dotenv
from sqlalchemy.exc import OperationalError, DisconnectionError
import logging
import time

logger = logging.getLogger(__name__)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Definir Base aqui para evitar imports circulares
Base = declarative_base()

def get_database_url():
    """Obter URL do banco com fallback para Railway PostgreSQL"""
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        # Tentar variáveis específicas do Railway PostgreSQL
        pguser = os.getenv("PGUSER")
        pgpassword = os.getenv("PGPASSWORD") 
        pghost = os.getenv("PGHOST")
        pgport = os.getenv("PGPORT", "5432")
        pgdatabase = os.getenv("PGDATABASE")
        
        if all([pguser, pgpassword, pghost, pgdatabase]):
            db_url = f"postgresql://{pguser}:{pgpassword}@{pghost}:{pgport}/{pgdatabase}"
            logger.info("🔧 Construindo URL do banco a partir de variáveis Railway")
        else:
            logger.warning("⚠️ Nenhuma configuração de banco encontrada")
            return None
    
    # Verificar se é URL do Supabase e avisar sobre possíveis problemas
    if "supabase.co" in db_url:
        logger.warning("⚠️ Detectada URL do Supabase - pode ter problemas de conectividade IPv4/IPv6")
    elif "railway.app" in db_url or "postgres" in db_url:
        logger.info("✅ Usando PostgreSQL (Railway ou compatível)")
    
    return db_url

# Função para criar engine com configurações otimizadas
def create_database_engine(database_url):
    """Criar engine do banco com configurações otimizadas"""
    if not database_url:
        logger.error("❌ URL do banco não configurada")
        return None
    
    try:
        # Configurações otimizadas para Railway
        engine = create_engine(
            database_url,
            echo=False,
            poolclass=QueuePool,
            pool_size=3,  # Reduzido para evitar muitas conexões
            max_overflow=5,
            pool_timeout=20,
            pool_recycle=1800,  # 30 minutos
            pool_pre_ping=True,
            connect_args={
                "connect_timeout": 10,
                "application_name": "vigia-backend",
                "options": "-c timezone=UTC"
            }
        )
        
        logger.info("✅ Engine do banco criada com sucesso")
        return engine
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar engine: {e}")
        return None

# Inicializar conexão
DATABASE_URL = get_database_url()
engine = None
SessionLocal = None

if DATABASE_URL:
    engine = create_database_engine(DATABASE_URL)
    if engine:
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logger.info("✅ SessionLocal configurada")
    else:
        logger.error("❌ Falha ao criar engine do banco")
else:
    logger.warning("⚠️ Banco de dados não configurado - modo sem persistência")

def get_db():
    """Dependency para obter sessão do banco com retry e fallback"""
    if not SessionLocal:
        logger.error("❌ Banco não configurado")
        # Em vez de falhar, retornar um mock ou None
        yield None
        return
    
    db = SessionLocal()
    max_retries = 2  # Reduzido para evitar loops longos
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # Teste simples de conexão
            db.execute(text("SELECT 1"))
            yield db
            return
        except (OperationalError, DisconnectionError) as e:
            retry_count += 1
            logger.warning(f"⚠️ Falha na conexão (tentativa {retry_count}/{max_retries}): {str(e)[:100]}")
            
            if retry_count < max_retries:
                try:
                    db.close()
                    time.sleep(0.5)  # Reduzido para 0.5s
                    db = SessionLocal()
                except:
                    pass
            else:
                logger.error(f"❌ Todas as tentativas falharam")
                db.rollback()
                raise
        except Exception as e:
            logger.error(f"❌ Erro geral: {str(e)[:100]}")
            db.rollback()
            raise
        finally:
            if retry_count >= max_retries or 'e' not in locals():
                try:
                    db.close()
                except:
                    pass

def test_database_connection():
    """Testar conexão sem lançar exceções"""
    if not engine:
        logger.warning("⚠️ Engine não configurada")
        return False
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.scalar()
            logger.info(f"✅ Banco conectado: {version[:50] if version else 'Unknown'}")
            return True
    except Exception as e:
        logger.error(f"❌ Teste de conexão falhou: {str(e)[:100]}")
        return False

def create_tables():
    """Criar tabelas se não existirem"""
    if not engine:
        logger.warning("⚠️ Não é possível criar tabelas - engine não configurada")
        return False
    
    try:
        # Importar modelos para garantir que estão registrados
        from models import Usuario, ProdutoMonitorado, HistoricoPreco, Alerta
        
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Tabelas criadas/verificadas com sucesso")
        return True
    except Exception as e:
        logger.error(f"❌ Erro ao criar tabelas: {e}")
        return False

def get_database_status():
    """Obter status completo do banco"""
    status = {
        "configured": DATABASE_URL is not None,
        "engine_created": engine is not None,
        "connection_test": False,
        "tables_created": False,
        "database_type": "unknown"
    }
    
    if DATABASE_URL:
        if "supabase.co" in DATABASE_URL:
            status["database_type"] = "supabase"
        elif "railway" in DATABASE_URL or "postgres" in DATABASE_URL:
            status["database_type"] = "postgresql"
    
    if engine:
        status["connection_test"] = test_database_connection()
        if status["connection_test"]:
            status["tables_created"] = create_tables()
    
    return status