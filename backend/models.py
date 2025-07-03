from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# SQLAlchemy Models
class Usuario(Base):
    __tablename__ = 'usuarios'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nome = Column(String, nullable=True)
    senha_hash = Column(String, nullable=True)  # Para autenticação email/senha
    google_id = Column(String, unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

class ProdutoMonitorado(Base):
    __tablename__ = 'produtos_monitorados'
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    ml_id = Column(String, index=True)
    nome = Column(String)
    preco_atual = Column(Float)
    estoque_atual = Column(Integer)
    url = Column(String)
    criado_em = Column(DateTime, default=datetime.utcnow)

class HistoricoPreco(Base):
    __tablename__ = 'historico_precos'
    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey('produtos_monitorados.id'))
    preco = Column(Float)
    estoque = Column(Integer)
    data = Column(DateTime, default=datetime.utcnow)

class Alerta(Base):
    __tablename__ = 'alertas'
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    produto_id = Column(Integer, ForeignKey('produtos_monitorados.id'))
    preco_alvo = Column(Float)
    enviado = Column(Boolean, default=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

# Pydantic Schemas
class UsuarioBase(BaseModel):
    email: EmailStr
    nome: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    senha: str

class UsuarioOut(UsuarioBase):
    id: int
    is_active: bool
    is_admin: bool
    class Config:
        orm_mode = True

class ProdutoMonitoradoBase(BaseModel):
    ml_id: str
    nome: str
    url: str

class ProdutoMonitoradoCreate(ProdutoMonitoradoBase):
    pass

class ProdutoMonitoradoOut(ProdutoMonitoradoBase):
    id: int
    preco_atual: float
    estoque_atual: int
    criado_em: datetime
    class Config:
        orm_mode = True

class HistoricoPrecoOut(BaseModel):
    id: int
    preco: float
    estoque: int
    data: datetime
    class Config:
        orm_mode = True

class AlertaBase(BaseModel):
    preco_alvo: float

class AlertaCreate(AlertaBase):
    pass

class AlertaOut(AlertaBase):
    id: int
    enviado: bool
    criado_em: datetime
    class Config:
        orm_mode = True 