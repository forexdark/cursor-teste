# VigIA Frontend

Aplicação Next.js (React) moderna, responsiva e profissional, com autenticação Google, dashboard, monitoramento de produtos, gráficos, alertas inteligentes e integração com backend FastAPI.

## Principais Tecnologias
- Next.js 14
- Tailwind CSS
- shadcn/ui
- Lucide React
- NextAuth (Google OAuth)
- Supabase
- Recharts/Chart.js

## Deploy
Pronto para deploy no Vercel ou Netlify.

### Deploy

- **Vercel:** Conecte o repositório, configure as variáveis de ambiente e faça o deploy.
- **Netlify:** Conecte o repositório, configure as variáveis de ambiente e faça o deploy.

## Instalação e Execução

```bash
cd frontend
npm install
cp .env.example .env.local # Configure suas variáveis de ambiente
npm run dev
```

Acesse: http://localhost:3000

O backend (API) deve estar rodando em http://localhost:8000

Para rodar o backend:

```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env     # Configure suas variáveis de ambiente
uvicorn main:app --reload
```

Acesse a documentação da API em: http://localhost:8000/docs

## Variáveis de Ambiente Obrigatórias

- `NEXT_PUBLIC_API_URL` — URL da API backend (FastAPI)
- `NEXTAUTH_URL` — URL do frontend (usado pelo NextAuth)
- `NEXTAUTH_SECRET` — Chave secreta para autenticação
- `GOOGLE_CLIENT_ID` — Client ID do Google OAuth
- `GOOGLE_CLIENT_SECRET` — Client Secret do Google OAuth
- `NEXT_PUBLIC_SUPABASE_URL` — URL do Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anônima do Supabase

## Suporte

- Email: suporte@mlmonitor.com.br
- Discord: [Link do servidor]

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## Roadmap

- Integração com outros marketplaces
- App mobile (React Native)
- Análise de tendências avançada
- Alertas via WhatsApp
- Dashboard de analytics
- API pública para desenvolvedores

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NomeDaFeature`)
3. Commit suas mudanças (`git commit -m 'Add feature'`)
4. Push para a branch (`git push origin feature/NomeDaFeature`)
5. Abra um Pull Request
