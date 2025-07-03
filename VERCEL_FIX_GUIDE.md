# 🚨 CORREÇÃO URGENTE - Erro Secret "nextauth_url"

## ❌ **PROBLEMA IDENTIFICADO**
O Vercel está procurando um secret "nextauth_url" que não existe. Isso é uma configuração incorreta.

## ✅ **SOLUÇÃO IMEDIATA**

### **PASSO 1: Limpar Variáveis no Vercel**
1. Vá no dashboard do Vercel → Seu projeto
2. **Settings** → **Environment Variables**
3. **DELETE TODAS** as variáveis de ambiente atuais
4. Comece do zero

### **PASSO 2: Recriar Variáveis Corretamente**
Adicione APENAS estas variáveis (sem secrets):

```env
NEXTAUTH_URL=https://vigia-meli.vercel.app
NEXTAUTH_SECRET=uma-chave-super-secreta-de-32-caracteres-ou-mais
GOOGLE_CLIENT_ID=787358726783-ef9eeimk7cv66pvqdnnd
GOOGLE_CLIENT_SECRET=GOCSPX-UZt1S319cSmrqVc0YWuZpDqpHM
NEXT_PUBLIC_API_URL=https://vigia-meli.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xzabloededbvaznttupqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

**⚠️ IMPORTANTE:**
- **NÃO** use "@" ou "references" 
- Cole os valores DIRETOS
- **NÃO** use secrets do Vercel

### **PASSO 3: Configurar Build Settings**
1. **Settings** → **General**
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`  
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`

### **PASSO 4: Forçar Deploy Manual**
Como o auto-deploy está falhando:

1. **Settings** → **Git**
2. **Ignored Build Step**: Cole este comando:
   ```bash
   if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then exit 1; else exit 0; fi
   ```
3. Isso vai parar auto-deploys
4. Depois faça deploy manual

### **PASSO 5: Deploy Manual via Interface**
1. **Deployments** → **Create Deployment**
2. Selecione branch `main` 
3. Clique **Deploy**

## 🔄 **MÉTODO ALTERNATIVO - Novo Projeto**

Se continuar dando erro, crie um novo projeto:

1. **New Project** no Vercel
2. **Import** o mesmo repositório GitHub
3. **Root Directory**: `frontend`
4. Configure as variáveis corretamente
5. Deploy

## 🎯 **VALORES CORRETOS**

Use EXATAMENTE estes valores:

```env
NEXTAUTH_URL=https://vigia-meli.vercel.app
NEXTAUTH_SECRET=68d56056cf2aa02dacb66335e0f04c39
GOOGLE_CLIENT_ID=787358726783-ef9eeimk7cv66pvqdnnd7fv5jlxwvpmd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-UZt1S319cSmrqVc0YWuZpDqpHM
NEXT_PUBLIC_API_URL=https://vigia-meli.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xzabloededbvaznttupqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YWJsb2RlZGJ2YXpudHR1cHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjM0NzYsImV4cCI6MjA1MTQ5OTQ3Nn0.MO8lWLMJcCFLRGsRr7tF5eHhVRwDfRrN_3S4g2E7AcE
```

## ✅ **VERIFICAÇÃO FINAL**

Depois do deploy:
1. Acesse: https://vigia-meli.vercel.app
2. Teste o login
3. Verifique console para erros

## 📞 **SE CONTINUAR FALHANDO**

Delete o projeto inteiro no Vercel e crie um novo. O problema é configuração incorreta que ficou "cached".

**🎯 A causa do erro é o uso incorreto de "secrets" ao invés de variáveis diretas.**