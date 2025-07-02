import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "no-reply@mlmonitor.com.br")

def enviar_alerta_email(destinatario: str, produto_nome: str, preco: float, url: str):
    subject = f"[VigIA] Alerta de preço para {produto_nome}"
    content = f"O produto <b>{produto_nome}</b> atingiu o preço desejado: <b>R$ {preco:.2f}</b>.<br>Veja mais: <a href='{url}'>{url}</a>"
    message = Mail(
        from_email=FROM_EMAIL,
        to_emails=destinatario,
        subject=subject,
        html_content=content
    )
    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        sg.send(message)
        return True
    except Exception as e:
        print(f"Erro ao enviar email: {e}")
        return False 