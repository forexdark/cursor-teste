# VigIA Backend

API FastAPI moderna, robusta e escalável, com integração Mercado Livre, Supabase (PostgreSQL), OpenAI, SendGrid, autenticação, agendamento de tarefas e pronta para deploy no Railway.

## Principais Tecnologias
- FastAPI (Python 3.11+)
- PostgreSQL (Supabase)
- APScheduler
- OpenAI
- SendGrid
- Mercado Livre API

## Deploy
Pronto para deploy no Railway.

## Instalação e Execução

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env     # Configure suas variáveis de ambiente
uvicorn main:app --reload
```

Acesse: http://localhost:8000
Acesse a documentação da API em: http://localhost:8000/docs

## Variáveis de Ambiente Obrigatórias

- `ML_CLIENT_ID` — Client ID do Mercado Livre
- `ML_CLIENT_SECRET` — Client Secret do Mercado Livre
- `SUPABASE_URL` — URL do Supabase
- `SUPABASE_KEY` — Service Role Key do Supabase
- `FRONTEND_URL` — URL do frontend
- `OPENAI_API_KEY` — Chave da API OpenAI
- `SENDGRID_API_KEY` — Chave da API SendGrid

## Suporte

- Email: suporte@mlmonitor.com.br
- Discord: [Link do servidor]

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## Instruções completas serão adicionadas após a implementação inicial. 