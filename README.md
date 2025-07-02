# VigIA - Monitoramento de Preços do Mercado Livre

Este projeto está sendo refeito do zero, com frontend (Next.js) e backend (FastAPI) separados, seguindo as melhores práticas para SaaS moderno, pronto para deploy no Vercel/Netlify (frontend) e Railway (backend).

## Estrutura do Projeto

- `frontend/` — Aplicação Next.js (React), autenticação, dashboard, monitoramento, gráficos, integração com backend, UI moderna.
- `backend/` — API FastAPI (Python), integração Mercado Livre, Supabase, OpenAI, SendGrid, agendamento de tarefas.

Cada parte terá seu próprio README com instruções detalhadas de instalação, configuração e deploy.

## Variáveis de Ambiente Obrigatórias

### Frontend
- `NEXT_PUBLIC_API_URL` — URL da API backend (FastAPI)
- `NEXTAUTH_URL` — URL do frontend (usado pelo NextAuth)
- `NEXTAUTH_SECRET` — Chave secreta para autenticação
- `GOOGLE_CLIENT_ID` — Client ID do Google OAuth
- `GOOGLE_CLIENT_SECRET` — Client Secret do Google OAuth
- `NEXT_PUBLIC_SUPABASE_URL` — URL do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anônima do Supabase

### Backend
- `ML_CLIENT_ID` — Client ID do Mercado Livre
- `ML_CLIENT_SECRET` — Client Secret do Mercado Livre
- `SUPABASE_URL` — URL do Supabase
- `SUPABASE_KEY` — Service Role Key do Supabase
- `FRONTEND_URL` — URL do frontend
- `OPENAI_API_KEY` — Chave da API OpenAI
- `SENDGRID_API_KEY` — Chave da API SendGrid

## Próximos Passos

- Criação da estrutura de pastas (`frontend/` e `backend/`)
- Adição dos arquivos principais de configuração e dependências
- Implementação das funcionalidades core

### Iniciando o Backend

Crie a pasta `backend/` e adicione os arquivos principais do FastAPI:
- `main.py`
- `requirements.txt`
- `.env.example`
- `README.md`

Acompanhe o progresso nesta branch!