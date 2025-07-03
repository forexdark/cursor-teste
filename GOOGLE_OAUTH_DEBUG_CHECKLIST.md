# 🔧 DIAGNÓSTICO COMPLETO - Erro Google OAuth

## ❌ **PROBLEMA ATUAL**
```
Erro 401: invalid_client
The OAuth client was not found.
```

## ✅ **VARIÁVEIS VERCEL - OK**
Você tem todas as variáveis corretas no Vercel:
- ✅ GOOGLE_CLIENT_ID
- ✅ GOOGLE_CLIENT_SECRET  
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET

## 🔍 **VERIFICAÇÕES NECESSÁRIAS**

### **1. VERIFICAR GOOGLE CLOUD CONSOLE (CRÍTICO)**

#### **Passo 1: URLs Autorizadas**
No Google Cloud Console, vá em:
**APIs & Services** → **Credentials** → **Seu OAuth 2.0 Client ID**

**Authorized JavaScript origins:**
```
https://vigia-meli.vercel.app
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://vigia-meli.vercel.app/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

#### **Passo 2: Verificar Client ID no Vercel**
1. No Vercel → Settings → Environment Variables
2. Clique no **ícone do olho** da variável `GOOGLE_CLIENT_ID`
3. **DEVE começar com:** `787358726783-`
4. **DEVE terminar com:** `.apps.googleusercontent.com`

### **2. POSSÍVEIS PROBLEMAS**

#### **Problema A: Domain Mismatch**
Se você está testando em `vigia-meli.vercel.app` mas o Google está configurado para outro domínio.

**✅ Solução:**
1. Verificar se NEXTAUTH_URL = https://vigia-meli.vercel.app
2. Verificar se Google Cloud tem exatamente esse domínio

#### **Problema B: Client ID Incorreto**
Se o Client ID foi copiado errado ou tem espaços.

**✅ Solução:**
1. Copiar novamente do Google Cloud Console
2. Colar no Vercel SEM espaços/quebras de linha

#### **Problema C: Cache do Browser**
Às vezes o browser guarda cache de OAuth.

**✅ Solução:**
1. Limpar cache do browser
2. Usar aba anônima/incógnita
3. Testar em outro browser

### **3. TESTE RÁPIDO - URLs DIRETAS**

#### **URL 1: Verificar Providers**
```
https://vigia-meli.vercel.app/api/auth/providers
```
**Deve mostrar:** `{"google": {"id": "google", "name": "Google", ...}}`

#### **URL 2: Login Google Direto**
```
https://vigia-meli.vercel.app/api/auth/signin/google
```
**Se der erro:** Problema nas credenciais ou configuração

### **4. DEBUG AVANÇADO**

#### **Passo 1: Verificar Logs NextAuth**
No browser (F12 → Console), procurar por:
```
🔍 NextAuth Environment Check: {
  hasGoogleClientId: true,
  hasGoogleClientSecret: true,
  ...
}
```

#### **Passo 2: Verificar Network**
1. F12 → Network
2. Tentar login Google
3. Procurar requisição para `/api/auth/signin/google`
4. Ver se retorna erro 400/401

### **5. SOLUÇÕES ESPECÍFICAS**

#### **Se Client ID está correto:**
1. Regenerar Client Secret no Google Cloud
2. Atualizar no Vercel
3. Fazer redeploy

#### **Se URLs estão corretas:**
1. Aguardar 5-10 minutos (propagação)
2. Limpar cache Google Cloud Console
3. Tentar novamente

#### **Se tudo parece correto:**
1. Criar novo OAuth Client no Google Cloud
2. Usar as novas credenciais
3. Testar

## 🎯 **AÇÃO IMEDIATA**

### **Método 1: Verificação Rápida**
1. Abra: https://vigia-meli.vercel.app/api/auth/providers
2. Se aparecer Google = Configuração NextAuth OK
3. Se não aparecer = Problema nas variáveis

### **Método 2: Teste Direto**
1. Aba anônima
2. https://vigia-meli.vercel.app/login
3. "Entrar com Google"
4. Ver erro específico

### **Método 3: Novo Client (Emergência)**
Se nada funcionar:
1. Google Cloud → Criar novo OAuth Client
2. Copiar novas credenciais
3. Atualizar Vercel
4. Testar

## 📞 **NEXT STEPS**

1. ✅ **Verificar URLs no Google Cloud**
2. ✅ **Testar as URLs diretas acima**
3. ✅ **Ver logs no console (F12)**
4. ✅ **Me avisar o que aparece**

**🎯 O problema é quase sempre URL incorreta ou credencial copiada errada!**