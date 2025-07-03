# ✅ CHECKLIST - Variáveis Vercel

## 🎯 **COPIE ESTAS VARIÁVEIS EXATAS PARA O VERCEL:**

```env
NEXTAUTH_URL=https://vigia-meli.vercel.app
NEXTAUTH_SECRET=68d56056cf2aa02dacb66335e0f04c39
GOOGLE_CLIENT_ID=787358726783-ef9eeimk7cv66pvqdnnd7fv5jlxwvpmd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-UZt1S319cSmrqVc0YWuZpDqpHM
NEXT_PUBLIC_API_URL=https://vigia-meli.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xzabloededbvaznttupqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YWJsb2RlZGJ2YXpudHR1cHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjM0NzYsImV4cCI6MjA1MTQ5OTQ3Nn0.MO8lWLMJcCFLRGsRr7tF5eHhVRwDfRrN_3S4g2E7AcE
```

## 📝 **PASSO A PASSO:**

### **1. Abrir Vercel Dashboard**
- Login no Vercel
- Clique no projeto `vigia-meli`

### **2. Ir em Environment Variables**
- **Settings** (aba superior)
- **Environment Variables** (lateral esquerda)

### **3. Verificar/Adicionar Cada Variável**

| Nome | Valor | Environments |
|------|-------|--------------|
| `NEXTAUTH_URL` | `https://vigia-meli.vercel.app` | Production, Preview |
| `NEXTAUTH_SECRET` | `68d56056cf2aa02dacb66335e0f04c39` | Production, Preview |
| `GOOGLE_CLIENT_ID` | `787358726783-ef9eeimk7cv66pvqdnnd7fv5jlxwvpmd.apps.googleusercontent.com` | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-UZt1S319cSmrqVc0YWuZpDqpHM` | Production, Preview |
| `NEXT_PUBLIC_API_URL` | `https://vigia-meli.up.railway.app` | Production, Preview |

### **4. Forçar Deploy**
- **Deployments** (aba superior)
- Último deploy → **3 pontos (•••)** → **Redeploy**

### **5. Aguardar e Testar**
- Aguardar 2-3 minutos
- Testar: `https://vigia-meli.vercel.app/login`
- Clicar "Entrar com Google"

## 🔍 **VERIFICAÇÃO RÁPIDA**

### **Se AINDA der erro:**
1. Abrir F12 → Console
2. Procurar por: `🔍 NextAuth Environment Check`
3. Verificar se `hasGoogleClientId: true`

### **URLs para testar:**
- Login: `https://vigia-meli.vercel.app/login`
- Google direto: `https://vigia-meli.vercel.app/api/auth/signin/google`
- NextAuth config: `https://vigia-meli.vercel.app/api/auth/providers`

## ⚠️ **IMPORTANTE:**
- ✅ Use os valores EXATOS (copie e cole)
- ✅ Não use espaços ou quebras de linha
- ✅ Marque "Production" e "Preview" para todas
- ✅ Faça redeploy após mudanças

## 🎯 **APÓS FUNCIONAR:**
- Login Google ✅
- Login Email ✅  
- Autorização Mercado Livre ✅
- Busca de produtos ✅

**🚀 Agora vai funcionar perfeitamente!**