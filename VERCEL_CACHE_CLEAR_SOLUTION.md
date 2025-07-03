# 🧹 COMO LIMPAR O CACHE DO VERCEL - SOLUÇÃO DEFINITIVA

## 🚨 **PROBLEMA ATUAL**
O Vercel está tentando usar um secret "nextauth_url" que não existe, causando erro de deploy.

## ✅ **SOLUÇÃO PASSO A PASSO**

### **OPÇÃO 1: Limpar via Interface (Mais Fácil)**

#### **Passo 1: Deletar Projeto Atual**
1. No dashboard do Vercel, clique no seu projeto
2. **Settings** (aba no topo)
3. **Advanced** (na lateral esquerda)
4. Role até o final da página
5. **Delete Project** → Confirme digitando o nome

#### **Passo 2: Criar Novo Projeto**
1. **New Project** → **Import Git Repository**
2. Selecione seu repositório `forexdark/cursor-teste`
3. **Framework Preset**: Next.js
4. **Root Directory**: `frontend`
5. **NÃO CLIQUE EM DEPLOY AINDA**

#### **Passo 3: Configurar Variáveis CORRETAMENTE**
Antes de fazer deploy, adicione estas variáveis:

```env
NEXTAUTH_URL=https://vigia-meli.vercel.app
NEXTAUTH_SECRET=68d56056cf2aa02dacb66335e0f04c39
GOOGLE_CLIENT_ID=787358726783-ef9eeimk7cv66pvqdnnd7fv5jlxwvpmd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-UZt1S319cSmrqVc0YWuZpDqpHM
NEXT_PUBLIC_API_URL=https://vigia-meli.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xzabloededbvaznttupqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6YWJsb2RlZGJ2YXpudHR1cHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjM0NzYsImV4cCI6MjA1MTQ5OTQ3Nn0.MO8lWLMJcCFLRGsRr7tF5eHhVRwDfRrN_3S4g2E7AcE
```

**⚠️ CRÍTICO:** Cole os valores DIRETOS, NÃO use @ ou referências a secrets!

#### **Passo 4: Deploy**
Agora clique **Deploy** e deve funcionar.

---

### **OPÇÃO 2: Forçar Limpeza no Projeto Atual**

Se quiser manter o projeto atual:

#### **Passo 1: Limpar Todas as Variáveis**
1. **Settings** → **Environment Variables**
2. **Delete TODAS** as variáveis existentes (uma por uma)
3. Confirme que a lista ficou vazia

#### **Passo 2: Recriar Variáveis SEM SECRETS**
Adicione as variáveis do Passo 3 acima (sem usar @)

#### **Passo 3: Limpar Build Cache (Se Disponível)**
1. **Settings** → **General**
2. Se encontrar "Clear Build Cache" → Clique
3. Se não encontrar, pule para o próximo passo

#### **Passo 4: Forçar Deploy**
1. **Deployments** → Encontre o último deploy
2. Clique nos **3 pontos (•••)** 
3. **Redeploy**

---

### **OPÇÃO 3: Via CLI (Se Souber Usar Terminal)**

```bash
# Instalar CLI do Vercel
npm i -g vercel

# Login
vercel login

# Link ao projeto
vercel link

# Limpar e fazer deploy
vercel --prod --force
```

---

## 🔍 **COMO ENCONTRAR "Clear Build Cache"**

### **Método 1: Settings → General**
1. Vá em **Settings** do projeto
2. **General** (primeira opção da lateral)
3. Role a página procurando por "Build Cache" ou "Cache"

### **Método 2: Settings → Storage**
1. Ainda em **Settings**
2. Procure por **Storage** ou **Advanced**
3. Pode estar em "Build Settings"

### **Método 3: Não Existe no Seu Plano**
- Alguns planos do Vercel não têm essa opção
- **SOLUÇÃO:** Use a Opção 1 (deletar e recriar projeto)

---

## 🎯 **SINAIS DE QUE DEU CERTO**

Após aplicar a solução:
1. ✅ Build deve passar sem erros
2. ✅ Site carrega em https://vigia-meli.vercel.app
3. ✅ Não mais mensagens sobre "secret nextauth_url"
4. ✅ Login funciona

---

## ❌ **SE CONTINUAR DANDO ERRO**

### **Erro Persistente de Secret**
- **CAUSA:** Cache interno do Vercel
- **SOLUÇÃO:** OBRIGATÓRIO deletar projeto e recriar

### **Erro de Build**
- **CAUSA:** Configuração incorreta
- **SOLUÇÃO:** Verificar se `Root Directory` = `frontend`

### **Erro 404**
- **CAUSA:** Deploy não completou
- **SOLUÇÃO:** Aguardar 3-5 minutos após deploy

---

## 🚀 **RECOMENDAÇÃO**

**Use a OPÇÃO 1** (deletar e recriar projeto). É mais rápido e garante que todo cache seja limpo.

O Vercel às vezes "lembra" configurações incorretas mesmo depois de alterações.

---

## 📞 **ÚLTIMA CARTADA**

Se NADA funcionar:
1. Mude o nome do repositório no GitHub
2. Crie projeto no Vercel com o novo nome
3. Configure tudo do zero

**🎯 O problema é 100% configuração incorreta de secrets no Vercel. Depois dessa limpeza, vai funcionar!**