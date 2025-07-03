# 🔍 TROUBLESHOOTING ESPECÍFICO - Google OAuth

## 🎯 **SEU CENÁRIO ATUAL**
- ✅ Variáveis corretas no Vercel
- ✅ Google Cloud Console configurado (vi nas imagens)
- ❌ Erro: "invalid_client" / "OAuth client was not found"

## 🕵️ **DIAGNÓSTICO PASSO A PASSO**

### **TESTE 1: Verificar Se NextAuth Vê as Variáveis**
1. Abra: `https://vigia-meli.vercel.app/api/auth/providers`
2. **Se mostrar Google:** ✅ Variáveis OK
3. **Se NÃO mostrar Google:** ❌ Variáveis não chegam no código

### **TESTE 2: Verificar Logs NextAuth**
1. Abra: `https://vigia-meli.vercel.app/login`
2. F12 → Console
3. Procurar: `🔍 NextAuth Environment Check`
4. Ver se `hasGoogleClientId: true`

### **TESTE 3: Verificar Google Cloud Console**
1. **Client ID deve começar com:** `787358726783-`
2. **Authorized redirect URIs deve ter:** 
   ```
   https://vigia-meli.vercel.app/api/auth/callback/google
   ```
3. **JavaScript origins deve ter:**
   ```
   https://vigia-meli.vercel.app
   ```

## 🔧 **SOLUÇÕES PRIORITÁRIAS**

### **SOLUÇÃO A: Recriar Credenciais Google**
1. Google Cloud Console → APIs & Services → Credentials
2. **Delete** o OAuth Client atual
3. **Create Credentials** → **OAuth client ID**
4. **Application type:** Web application
5. **Name:** VigIA Production
6. **Authorized JavaScript origins:**
   ```
   https://vigia-meli.vercel.app
   http://localhost:3000
   ```
7. **Authorized redirect URIs:**
   ```
   https://vigia-meli.vercel.app/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
8. **Create** → Copiar novas credenciais
9. **Atualizar no Vercel** → **Redeploy**

### **SOLUÇÃO B: Force Refresh Vercel**
1. Vercel → Projeto → Settings → Environment Variables
2. **Edit** cada variável Google (mesmo que não mude)
3. **Save** cada uma
4. **Deployments** → **Redeploy**
5. Aguardar 3-5 minutos

### **SOLUÇÃO C: Verificar Domain Exato**
1. Verificar se `NEXTAUTH_URL` = `https://vigia-meli.vercel.app`
2. **SEM barra final (/)** 
3. **SEM www**
4. **Exatamente igual no Google Cloud**

### **SOLUÇÃO D: Temporary Workaround**
1. Desabilitar Google temporariamente
2. Testar login email/senha
3. Se funcionar = problema só no Google
4. Se não funcionar = problema maior

## 🚨 **ERROS COMUNS**

### **Erro: "invalid_client"**
- **Causa 95%:** Client ID incorreto ou URLs no Google Cloud
- **Fix:** Verificar/recriar credenciais

### **Erro: "redirect_uri_mismatch"**
- **Causa:** URL de callback não autorizada
- **Fix:** Adicionar URL exata no Google Cloud

### **Erro: "access_denied"**
- **Causa:** Usuário cancelou ou conta restrita
- **Fix:** Normal, tentar novamente

## 🎯 **TESTE FINAL**

### **Cenário 1: Tudo Funciona**
```
✅ /api/auth/providers mostra Google
✅ Login Google funciona
✅ Redirecionamento OK
```

### **Cenário 2: Providers OK, Login Falha**
```
✅ /api/auth/providers mostra Google
❌ Login Google dá erro
🔧 Problema: URLs no Google Cloud
```

### **Cenário 3: Providers Vazio**
```
❌ /api/auth/providers não mostra Google
❌ Login Google nem aparece
🔧 Problema: Variáveis Vercel
```

## 📞 **PRÓXIMOS PASSOS**

1. ✅ **Teste a URL:** `https://vigia-meli.vercel.app/api/auth/providers`
2. ✅ **Veja o console (F12)** quando abrir /login
3. ✅ **Me avise o resultado**
4. ✅ **Se necessário, recriaremos as credenciais Google**

**🎯 Em 90% dos casos é URL incorreta no Google Cloud Console!**