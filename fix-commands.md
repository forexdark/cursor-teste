# 🔧 Comandos de Correção para Deploy

## Se o deploy falhou, execute estes comandos localmente:

### 📦 **1. Corrigir Dependências Backend**
```bash
# Navegar para o diretório backend
cd backend

# Instalar dependências
pip install -r requirements.txt

# Testar localmente
uvicorn main:app --reload
```

### 🌐 **2. Corrigir Dependências Frontend** 
```bash
# Navegar para o diretório frontend
cd frontend

# Limpar cache
rm -rf node_modules package-lock.json .next

# Reinstalar dependências
npm install

# Testar build
npm run build
npm start
```

### 🚀 **3. Forçar Redeploy**

#### Railway (Backend):
```bash
# No terminal do Railway ou localmente:
railway login
railway link
railway deploy
```

#### Vercel (Frontend):
```bash
# No terminal ou interface Vercel:
vercel --prod
```

### 🔍 **4. Verificar Logs**

#### Railway:
```bash
railway logs
```

#### Vercel:
- Acesse: https://vercel.com/dashboard
- Clique no projeto → "Functions" → Ver logs

### ⚡ **5. Quick Fix - Se tudo falhou**

```bash
# 1. Clone fresh do repositório
git clone SEU_REPOSITORIO
cd SEU_REPOSITORIO

# 2. Backend
cd backend
pip install --upgrade pip
pip install -r requirements.txt
python main.py  # Testar local

# 3. Frontend  
cd ../frontend
npm install --force
npm run build  # Testar build
npm start      # Testar local

# 4. Fazer commit das correções
git add .
git commit -m "fix: corrigir problemas de deploy"
git push origin main
```

### 🎯 **6. Verificação Rápida**

Depois do deploy, teste estes URLs:

```bash
# Backend health check
curl https://SEU-BACKEND.up.railway.app/health

# Frontend
curl https://SEU-FRONTEND.vercel.app

# API docs
open https://SEU-BACKEND.up.railway.app/docs
```

### ❌ **7. Erros Comuns e Soluções**

#### "Module not found"
```bash
# Verificar se está no diretório correto
pwd
# Deve estar em /backend ou /frontend

# Reinstalar dependências
rm -rf node_modules && npm install  # Frontend
pip install --force-reinstall -r requirements.txt  # Backend
```

#### "Port already in use"
```bash
# Matar processo na porta
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

#### "Database connection failed"
```bash
# Verificar variável de ambiente
echo $DATABASE_URL
# Se vazia, configurar no Railway/Vercel
```

### 📞 **8. Se NADA funcionar**

1. **Delete os projetos no Railway/Vercel**
2. **Crie novos projetos do zero** 
3. **Siga o guia de deploy passo a passo**
4. **Use este repositório como referência**

Agora todos os problemas de deploy devem estar resolvidos! 🎉