from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from database import Base

# SQLAlchemy Models
class Usuario(Base):
    __tablename__ = 'usuarios'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nome = Column(String(255), nullable=True)
    senha_hash = Column(String(255), nullable=True)  # Para autenticação email/senha
    google_id = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    criado_em = Column(DateTime, default=datetime.utcnow)

class ProdutoMonitorado(Base):
    __tablename__ = 'produtos_monitorados'
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    ml_id = Column(String(50), index=True)
    nome = Column(Text)
    preco_atual = Column(Float, default=0.0)
    estoque_atual = Column(Integer, default=0)
    url = Column(Text)
    criado_em = Column(DateTime, default=datetime.utcnow)

class HistoricoPreco(Base):
    __tablename__ = 'historico_precos'
    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey('produtos_monitorados.id'))
    preco = Column(Float)
    estoque = Column(Integer, default=0)
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

class UsuarioCreate(BaseModel):
    email: EmailStr
    nome: Optional[str] = None
    senha: str

class LoginRequest(BaseModel):
    email: str
    senha: str

class MLAuthRequest(BaseModel):
    code: str
    state: Optional[str] = None

class UsuarioOut(UsuarioBase):
    id: int
    is_active: bool
    is_admin: bool
    
    class Config:
        from_attributes = True

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
        from_attributes = True

class HistoricoPrecoOut(BaseModel):
    id: int
    preco: float
    estoque: int
    data: datetime
    
    class Config:
        from_attributes = True

class AlertaBase(BaseModel):
    preco_alvo: float

class AlertaCreate(AlertaBase):
    produto_id: int

class AlertaOut(AlertaBase):
    id: int
    enviado: bool
    criado_em: datetime
    
    class Config:
        from_attributes = True