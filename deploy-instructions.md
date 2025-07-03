# 🚀 Instruções de Deploy Corrigidas - VigIA

## ❌ Problema Identificado
O Vercel estava tentando usar um secret "nextauth_url" que não existe. Corrigimos as configurações.

## ✅ Soluções Aplicadas

### 1. **Corrigido vercel.json**
- Removido referências a secrets inexistentes
- Configuração simplificada
- Headers CORS corretos

### 2. **Next.js Config Otimizado**
- Configuração de ambiente melhorada
- Fallbacks para desenvolvimento
- Build otimizado

### 3. **Variáveis de Ambiente Corrigidas**
- AuthProvider mais robusto
- Logs apenas em desenvolvimento
- Melhor tratamento de erros

---

## 🔧 **PASSOS PARA CORRIGIR O DEPLOY**

### **Passo 1: Limpar Cache do Vercel**
1. Vá no dashboard do Vercel
2. Clique no seu projeto
3. "Settings" → "General" → "Clear Build Cache"

### **Passo 2: Configurar Variáveis de Ambiente no Vercel**
Vá em "Settings" → "Environment Variables" e adicione:

```env
NEXTAUTH_URL=https://SEU-PROJETO.vercel.app
NEXTAUTH_SECRET=uma-chave-super-secreta-complexa-para-jwt
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
NEXT_PUBLIC_API_URL=https://vigia-meli.up.railway.app
```

**⚠️ IMPORTANTE:**
- `NEXTAUTH_SECRET`: Gere uma chave aleatória de 32+ caracteres
- `NEXTAUTH_URL`: Sua URL do Vercel (será preenchida automaticamente)
- Não use "@" ou referências a secrets que não existem

### **Passo 3: Configurar Build Settings no Vercel**
1. "Settings" → "Build & Development Settings"
2. **Root Directory**: deixe vazio ou `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`
5. **Install Command**: `npm install`

### **Passo 4: Forçar Novo Deploy**
1. **Opção A - Interface:**
   - Vá em "Deployments"
   - Clique nos 3 pontos do último deploy
   - "Redeploy"

2. **Opção B - Push no Git:**
   ```bash
   git add .
   git commit -m "fix: corrigir configurações do Vercel"
   git push origin main
   ```

3. **Opção C - CLI do Vercel:**
   ```bash
   npm i -g vercel
   vercel --prod --force
   ```

---

## 📱 **TESTE APÓS DEPLOY**

### 1. **Verificar URLs**
- ✅ Frontend: `https://SEU-PROJETO.vercel.app`
- ✅ Backend: `https://vigia-meli.up.railway.app/health`

### 2. **Testar Funcionalidades**
```bash
# 1. Acesse o frontend
open https://SEU-PROJETO.vercel.app

# 2. Teste registro de usuário
# 3. Teste login
# 4. Teste busca de produtos
# 5. Teste adição de produtos
```

---

## 🔍 **VERIFICAR LOGS**

### **Vercel:**
1. Dashboard → Seu projeto → "Functions"
2. Clique em qualquer function para ver logs
3. Verifique se há erros de NextAuth

### **Railway:**
1. Dashboard → Seu projeto → "Logs"
2. Verifique se há requisições chegando do Vercel

---

## ❌ **Se Ainda Der Erro**

### **Erro: "NEXTAUTH_SECRET missing"**
```env
# Adicione no Vercel:
NEXTAUTH_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### **Erro: "Cannot resolve API URL"**
```env
# Verifique no Vercel:
NEXT_PUBLIC_API_URL=https://vigia-meli.up.railway.app
```

### **Erro: "Google OAuth não funciona"**
1. Verifique Google Cloud Console
2. Authorized redirect URIs deve incluir:
   ```
   https://SEU-PROJETO.vercel.app/api/auth/callback/google
   ```

---

## ✅ **Checklist Final**

- [ ] ✅ Cache do Vercel limpo
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Build settings corretos  
- [ ] ✅ Deploy forçado/novo
- [ ] ✅ Frontend carregando
- [ ] ✅ Login funcionando
- [ ] ✅ Backend respondendo

---

## 🎯 **URLs Finais**

Depois do deploy bem-sucedido:

- **Frontend:** `https://SEU-PROJETO.vercel.app`
- **Backend:** `https://vigia-meli.up.railway.app`
- **API Docs:** `https://vigia-meli.up.railway.app/docs`

**🎉 Agora o deploy deve funcionar perfeitamente!**

---

## 📞 **Última Opção**

Se nada funcionar:
1. Delete o projeto no Vercel
2. Crie um novo projeto
3. Conecte o GitHub novamente
4. Configure tudo do zero com essas instruções

O problema era a referência a secrets inexistentes. Agora está corrigido! 🚀