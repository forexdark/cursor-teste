# Como Testar a API VigIA - Guia Completo

## 🛠️ Ferramentas Necessárias

### Opção 1: Postman (Recomendado)
1. **Baixe o Postman**: https://www.postman.com/downloads/
2. **Instale e abra**
3. **Clique em "New" > "HTTP Request"**

### Opção 2: Insomnia
1. **Baixe o Insomnia**: https://insomnia.rest/download
2. **Crie uma nova coleção**

### Opção 3: Navegador (apenas GET)
- **Copie e cole a URL diretamente no navegador**

---

## 🧪 TESTES PASSO A PASSO

### 1. **TESTE BÁSICO - Verificar se API está online**

**URL:** `https://vigia-meli.up.railway.app/health`
**Método:** `GET`

**No Postman/Insomnia:**
- Cole a URL
- Método: GET
- Clique em "Send"

**Resultado esperado:**
```json
{
  "status": "ok"
}
```

---

### 2. **REGISTRAR USUÁRIO**

**URL:** `https://vigia-meli.up.railway.app/auth/register`
**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "teste@exemplo.com",
  "nome": "Usuário Teste",
  "senha": "123456"
}
```

**Como fazer no Postman:**
1. Cole a URL
2. Método: POST
3. Aba "Headers" → Add: `Content-Type: application/json`
4. Aba "Body" → Raw → JSON → Cole o JSON acima
5. Clique "Send"

**Resultado esperado:**
```json
{
  "email": "teste@exemplo.com",
  "nome": "Usuário Teste", 
  "id": 1,
  "is_active": true,
  "is_admin": false
}
```

---

### 3. **FAZER LOGIN**

**URL:** `https://vigia-meli.up.railway.app/auth/login`
**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "teste@exemplo.com",
  "senha": "123456"
}
```

**Resultado esperado:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1Q...",
  "token_type": "bearer"
}
```

**⚠️ IMPORTANTE:** Copie o `access_token` - você vai precisar dele!

---

### 4. **TESTAR BUSCA DE PRODUTOS (Autenticado)**

**URL:** `https://vigia-meli.up.railway.app/produtos/search/iphone`
**Método:** `GET`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Como fazer:**
1. Cole a URL (pode mudar "iphone" por qualquer produto)
2. Método: GET
3. Aba "Headers" → Add: `Authorization: Bearer SEU_TOKEN_AQUI`
   - **Substitua `SEU_TOKEN_AQUI` pelo token que você copiou no login**
4. Clique "Send"

**Exemplo completo:**
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0ZUBleGVtcGxvLmNvbSIsImV4cCI6MTcwNDEyNjAwMH0.abc123
```

---

### 5. **ADICIONAR PRODUTO PARA MONITORAMENTO**

**URL:** `https://vigia-meli.up.railway.app/produtos/`
**Método:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer SEU_TOKEN_AQUI
```

**Body (JSON):**
```json
{
  "ml_id": "MLB123456789",
  "nome": "iPhone 15 Pro Max",
  "url": "https://produto.mercadolivre.com.br/MLB-123456789"
}
```

---

### 6. **LISTAR PRODUTOS MONITORADOS**

**URL:** `https://vigia-meli.up.railway.app/produtos/`
**Método:** `GET`

**Headers:**
```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 🔧 ENDPOINTS DE TESTE E DIAGNÓSTICO

### Testar API Mercado Livre
**URL:** `https://vigia-meli.up.railway.app/test/mercadolivre`
**Método:** `GET`

### Testar Busca Pública
**URL:** `https://vigia-meli.up.railway.app/test/search/iphone`
**Método:** `GET`

### Testar Banco de Dados
**URL:** `https://vigia-meli.up.railway.app/test/database`
**Método:** `GET`

---

## ❌ PROBLEMAS COMUNS E SOLUÇÕES

### Erro 401 "Unauthorized"
- **Causa:** Token inválido ou ausente
- **Solução:** Faça login novamente e use o novo token

### Erro 404 "Not Found"
- **Causa:** URL incorreta
- **Solução:** Verifique se a URL está correta

### Erro 405 "Method Not Allowed"
- **Causa:** Método HTTP errado (GET ao invés de POST)
- **Solução:** Use o método correto

### Erro 500 "Internal Server Error"
- **Causa:** Problema no servidor
- **Solução:** Verifique os logs do Railway

---

## 🎯 ORDEM RECOMENDADA PARA TESTAR

1. ✅ **Health Check** - Verificar se API está online
2. ✅ **Registrar usuário** - Criar conta
3. ✅ **Login** - Obter token
4. ✅ **Buscar produtos** - Testar busca
5. ✅ **Adicionar produto** - Adicionar ao monitoramento
6. ✅ **Listar produtos** - Ver produtos monitorados

---

## 📱 COMO COPIAR O TOKEN NO POSTMAN

1. Após fazer login, vá na resposta
2. Copie APENAS o valor entre aspas do `access_token`
3. **Exemplo:** Se a resposta for:
   ```json
   {
     "access_token": "eyJ0eXAiOiJKV1Q...",
     "token_type": "bearer"
   }
   ```
   Copie: `eyJ0eXAiOiJKV1Q...`

4. Use assim no header: `Authorization: Bearer eyJ0eXAiOiJKV1Q...`

---

## 🚀 TESTANDO NO NAVEGADOR (Apenas GET)

Para endpoints GET, você pode testar diretamente no navegador:

- ✅ `https://vigia-meli.up.railway.app/health`
- ✅ `https://vigia-meli.up.railway.app/test/mercadolivre`
- ✅ `https://vigia-meli.up.railway.app/test/search/iphone`