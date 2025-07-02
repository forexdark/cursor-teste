from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from mercadolivre import buscar_produto_ml
from models import ProdutoMonitorado, HistoricoPreco, Alerta, Usuario
import asyncio
from datetime import datetime
from email_utils import enviar_alerta_email

scheduler = BackgroundScheduler()

# Função para atualizar todos os produtos monitorados periodicamente
def atualizar_todos_produtos():
    db: Session = SessionLocal()
    try:
        produtos = db.query(ProdutoMonitorado).all()
        for produto in produtos:
            dados_ml = asyncio.run(buscar_produto_ml(produto.ml_id))
            if dados_ml:
                produto.nome = dados_ml["nome"]
                produto.preco_atual = dados_ml["preco"]
                produto.estoque_atual = dados_ml["estoque"]
                produto.url = dados_ml["url"]
                db.commit()
                db.refresh(produto)
                # Registrar histórico
                historico = HistoricoPreco(
                    produto_id=produto.id,
                    preco=produto.preco_atual,
                    estoque=produto.estoque_atual,
                    data=datetime.utcnow()
                )
                db.add(historico)
                db.commit()
                # Verificar alertas
                alertas = db.query(Alerta).filter(Alerta.produto_id == produto.id, Alerta.enviado == False).all()
                for alerta in alertas:
                    if produto.preco_atual <= alerta.preco_alvo:
                        usuario = db.query(Usuario).filter(Usuario.id == alerta.usuario_id).first()
                        if usuario:
                            enviar_alerta_email(usuario.email, produto.nome, produto.preco_atual, produto.url)
                            alerta.enviado = True
                            db.commit()
    finally:
        db.close()

# Agendar para rodar a cada 30 minutos
scheduler.add_job(atualizar_todos_produtos, 'interval', minutes=30)

def start_scheduler():
    scheduler.start() 