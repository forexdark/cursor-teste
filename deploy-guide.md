# 🚀 Guia Completo de Deploy - VigIA

## 📋 Checklist Pré-Deploy

### ✅ **1. Contas Necessárias**
- [ ] Conta no Railway (backend)
- [ ] Conta no Vercel (frontend)  
- [ ] Conta no Supabase (banco de dados)
- [ ] Conta no Google Cloud (OAuth)
- [ ] Conta no Mercado Livre Developers

---

## 🗄️ **PASSO 1: Configurar Banco de Dados (Supabase)**

### 1.1 Criar Projeto
1. Acesse: https://supabase.com
2. "New Project" → Nome: `vigia-db`
3. Aguarde criação (2-3 minutos)

### 1.2 Executar SQL
1. Vá em "SQL Editor"
2. Execute este SQL:

```sql
-- Criar tabelas
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255),
    senha_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE produtos_monitorados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    ml_id VARCHAR(255) NOT NULL,
    nome TEXT NOT NULL,
    preco_atual DECIMAL(10,2) DEFAULT 0,
    estoque_atual INTEGER DEFAULT 0,
    url TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE historico_precos (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER REFERENCES produtos_monitorados(id),
    preco DECIMAL(10,2) NOT NULL,
    estoque INTEGER DEFAULT 0,
    data TIMESTAMP DEFAULT NOW()
);

CREATE TABLE alertas (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    produto_id INTEGER REFERENCES produtos_monitorados(id),
    preco_alvo DECIMAL(10,2) NOT NULL,
    enviado BOOLEAN DEFAULT false,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_produtos_usuario ON produtos_monitorados(usuario_id);
CREATE INDEX idx_historico_produto ON historico_precos(produto_id);
CREATE INDEX idx_alertas_usuario ON alertas(usuario_id);
```

### 1.3 Obter Credenciais
1. Vá em "Settings" → "Database"
2. Copie a "Connection string" (URI)
3. **Salve essa URL - você vai precisar!**

---

## 🔧 **PASSO 2: Deploy Backend (Railway)**

### 2.1 Conectar GitHub
1. Acesse: https://railway.app
2. "Start a New Project" → "Deploy from GitHub repo"
3. Selecione seu repositório
4. "Deploy Now"

### 2.2 Configurar Variáveis de Ambiente
1. Clique no projeto → "Variables"
2. Adicione essas variáveis:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
ML_CLIENT_ID=seu_ml_client_id
ML_CLIENT_SECRET=seu_ml_client_secret  
FRONTEND_URL=https://seu-frontend.vercel.app
NEXTAUTH_SECRET=uma-chave-super-secreta-aqui
OPENAI_API_KEY=sua_openai_key
SENDGRID_API_KEY=sua_sendgrid_key
PORT=8000
```

### 2.3 Configurar Build
1. "Settings" → "Build"
2. **Root Directory:** `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.4 Testar Deploy
1. Aguarde deploy (3-5 minutos)
2. Acesse: `https://SEU-PROJETO.up.railway.app/health`
3. Deve retornar: `{"status": "ok"}`

---

## 🌐 **PASSO 3: Deploy Frontend (Vercel)**

### 3.1 Conectar GitHub
1. Acesse: https://vercel.com
2. "New Project" → Import Git Repository
3. **Root Directory:** `frontend`

### 3.2 Configurar Build
1. **Framework Preset:** Next.js
2. **Root Directory:** `frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `.next`

### 3.3 Variáveis de Ambiente
```env
NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app
NEXTAUTH_URL=https://seu-frontend.vercel.app
NEXTAUTH_SECRET=mesma-chave-do-backend
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
```

### 3.4 Deploy
1. "Deploy" → Aguarde (2-3 minutos)
2. Acesse sua URL do Vercel
3. Teste o login/registro

---

## 🔑 **PASSO 4: Configurar OAuth Google**

### 4.1 Google Cloud Console
1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto: "VigIA"
3. "APIs & Services" → "Credentials"

### 4.2 Configurar OAuth
1. "Create Credentials" → "OAuth 2.0 Client IDs"
2. **Application type:** Web application
3. **Authorized redirect URIs:**
   ```
   https://seu-frontend.vercel.app/api/auth/callback/google
   ```
4. Copie `Client ID` e `Client Secret`

### 4.3 Atualizar Variáveis
1. **Vercel:** Adicione `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
2. **Railway:** Adicione `GOOGLE_CLIENT_ID` se necessário

---

## 🛒 **PASSO 5: Configurar Mercado Livre API**

### 5.1 Criar Aplicação
1. Acesse: https://developers.mercadolivre.com.br
2. "Criar aplicação"
3. **Nome:** VigIA
4. **URL de retorno:** `https://seu-frontend.vercel.app/auth/mercadolivre/callback`

### 5.2 Obter Credenciais
1. Copie `Client ID` e `Client Secret`
2. Adicione no Railway:
   ```env
   ML_CLIENT_ID=seu_app_id
   ML_CLIENT_SECRET=seu_client_secret
   ```

---

## ✅ **PASSO 6: Testes Finais**

### 6.1 Testar Backend
```bash
# Health check
curl https://seu-backend.up.railway.app/health

# Registrar usuário
curl -X POST https://seu-backend.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@email.com","nome":"Teste","senha":"123456"}'
```

### 6.2 Testar Frontend
1. Acesse: `https://seu-frontend.vercel.app`
2. Teste registro/login
3. Teste busca de produtos
4. Teste adição de produtos

### 6.3 Testar Integração
1. Faça login no frontend
2. Busque por "iPhone"
3. Adicione um produto
4. Verifique se aparece no dashboard

---

## 🔧 **Troubleshooting**

### ❌ Backend não carrega
```bash
# Verificar logs
railway logs

# Comum: Variável de ambiente faltando
# Solução: Verificar todas as variáveis
```

### ❌ Frontend com erro de build
```bash
# Verificar logs no Vercel
# Comum: Dependência faltando
# Solução: npm install no diretório frontend
```

### ❌ CORS Error
```javascript
// Verificar se FRONTEND_URL está correto no Railway
FRONTEND_URL=https://seu-frontend.vercel.app
```

### ❌ Banco de dados
```sql
-- Testar conexão no Supabase SQL Editor
SELECT 1;

-- Se falhar, verificar DATABASE_URL no Railway
```

---

## 🎯 **Domínios Personalizados (Opcional)**

### Vercel
1. "Settings" → "Domains"
2. Adicionar seu domínio
3. Configurar DNS

### Railway
1. "Settings" → "Domains"
2. Adicionar domínio personalizado
3. Atualizar FRONTEND_URL

---

## 📞 **Suporte**

Se algo não funcionar:
1. ✅ Verifique todas as variáveis de ambiente
2. ✅ Confira os logs (Railway/Vercel)
3. ✅ Teste endpoints individualmente
4. ✅ Verifique se o banco está funcionando

**URLs importantes:**
- Backend: `https://SEU-PROJETO.up.railway.app`
- Frontend: `https://SEU-PROJETO.vercel.app`
- Docs API: `https://SEU-PROJETO.up.railway.app/docs`

---

## 🎉 **Checklist Final**

- [ ] ✅ Supabase configurado e tabelas criadas
- [ ] ✅ Railway com backend funcionando
- [ ] ✅ Vercel com frontend funcionando  
- [ ] ✅ Google OAuth configurado
- [ ] ✅ Mercado Livre API configurada
- [ ] ✅ Todas as variáveis de ambiente setadas
- [ ] ✅ Testes de login/registro funcionando
- [ ] ✅ Busca de produtos funcionando
- [ ] ✅ Monitoramento funcionando

**🎊 Parabéns! Seu VigIA está no ar!**