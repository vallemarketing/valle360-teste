# 🔧 Guia de Troubleshooting - Integração cPanel

## ✅ Checklist de Verificação

### 1. **Verificar Credenciais do cPanel**

As credenciais atuais configuradas no `.env.local` são:

```env
CPANEL_DOMAIN=https://br.odin7080.com.br:2083
CPANEL_USER=valle360com
CPANEL_PASSWORD=*Vallegroup23
```

**Passos para validar:**

1. Acesse o cPanel manualmente:
   ```
   https://br.odin7080.com.br:2083
   ```

2. Faça login com:
   - **Usuário:** `valle360com`
   - **Senha:** `*Vallegroup23`

3. Se conseguir acessar, as credenciais estão corretas ✅

4. Verifique se o domínio `valle360.com.br` aparece listado no cPanel

---

### 2. **Testar API do cPanel Manualmente**

Use este comando curl para testar a criação de email:

```bash
curl -X GET "https://br.odin7080.com.br:2083/execute/Email/add_pop?email=teste&password=SenhaForte123&domain=valle360.com.br&quota=500" \
  -H "Authorization: Basic $(echo -n 'valle360com:*Vallegroup23' | base64)" \
  -H "Content-Type: application/json"
```

**Resposta esperada (sucesso):**
```json
{
  "result": {
    "status": 1,
    "data": {
      "email": "teste@valle360.com.br"
    }
  }
}
```

**Respostas de erro comuns:**

- **HTML ao invés de JSON**: URL incorreta ou autenticação falhando
- **404 Not Found**: Endpoint incorreto ou porta errada
- **401 Unauthorized**: Credenciais inválidas
- **Timeout**: Servidor offline ou URL incorreta

---

### 3. **Problemas Comuns e Soluções**

#### ❌ Erro: "cPanel retornou HTML ao invés de JSON"

**Causas possíveis:**
1. URL do cPanel incorreta
2. Porta incorreta (deve ser :2083 ou :2087 para SSL)
3. Autenticação falhando (credenciais incorretas)

**Solução:**
```env
# Formato correto:
CPANEL_DOMAIN=https://seu-servidor.com:2083

# OU com IP:
CPANEL_DOMAIN=https://123.456.789.123:2083
```

---

#### ❌ Erro: "Falha na autenticação com o cPanel"

**Causas possíveis:**
1. Usuário ou senha incorretos
2. Conta bloqueada
3. IP bloqueado no firewall

**Solução:**
1. Verifique o usuário e senha no painel de controle da hospedagem
2. Entre em contato com o suporte da hospedagem para verificar bloqueios
3. Certifique-se de que não há espaços extras nas variáveis de ambiente

---

#### ❌ Erro: "Endpoint do cPanel não encontrado"

**Causas possíveis:**
1. Porta incorreta
2. Caminho da API errado
3. cPanel desatualizado

**Solução:**
```bash
# Testar conexão básica:
curl -I https://br.odin7080.com.br:2083

# Testar autenticação:
curl -u valle360com:*Vallegroup23 https://br.odin7080.com.br:2083/cpsess1234567890/json-api/cpanel
```

---

#### ❌ Erro: "Timeout ao conectar com o cPanel"

**Causas possíveis:**
1. Servidor offline
2. Firewall bloqueando
3. URL incorreta

**Solução:**
1. Verifique se o servidor está online
2. Teste ping: `ping br.odin7080.com.br`
3. Verifique se a porta 2083 está aberta

---

#### ❌ Erro: "Domínio não suportado"

O sistema só aceita emails do domínio `valle360.com.br`.

**Solução:**
Se precisar usar outro domínio, remova a validação na linha 70 de:
```
src/app/api/cpanel/create-email/route.ts
```

---

### 4. **Logs Detalhados**

Após a atualização, o sistema agora mostra logs detalhados:

```
============================================================
📧 CRIAÇÃO DE EMAIL NO CPANEL
============================================================
Email: guilherme.valle@valle360.com.br
Username: guilherme.valle
Domain: valle360.com.br
cPanel URL: https://br.odin7080.com.br:2083
API Endpoint: /execute/Email/add_pop
cPanel User: valle360com
============================================================

📊 Status HTTP: 200
📋 Headers: {...}
📦 Resposta do cPanel: {...}

============================================================
✅ EMAIL CRIADO COM SUCESSO
============================================================
Email: guilherme.valle@valle360.com.br
============================================================
```

---

### 5. **Alternativas se o cPanel não funcionar**

Se mesmo após todas as verificações o cPanel não funcionar, você tem 3 opções:

#### **Opção 1: Desabilitar criação automática**

No arquivo `src/app/admin/colaboradores/novo/page.tsx`, comente a chamada para criar email:

```typescript
// Comentar estas linhas (aproximadamente linha 250):
// const emailResult = await fetch('/api/cpanel/create-email', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ email: formData.email, password: senhaProvisoria })
// })
```

O sistema continuará funcionando, mas você precisará criar os emails manualmente no cPanel.

#### **Opção 2: Criar emails manualmente**

1. Acesse: https://br.odin7080.com.br:2083
2. Vá em: **Email Accounts**
3. Clique em: **Create**
4. Preencha:
   - Email: `nome.sobrenome`
   - Domain: `valle360.com.br`
   - Password: use a mesma senha provisória do sistema
   - Quota: 500 MB

#### **Opção 3: Usar outro provedor de email**

Considere usar provedores especializados:
- **Google Workspace** (recomendado para empresas)
- **Microsoft 365**
- **Zoho Mail**

---

### 6. **Configurar na Vercel (Produção)**

Quando tudo estiver funcionando localmente, adicione as variáveis na Vercel:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Vá em: **Settings → Environment Variables**
4. Adicione:
   - `CPANEL_DOMAIN` = `https://br.odin7080.com.br:2083`
   - `CPANEL_USER` = `valle360com`
   - `CPANEL_PASSWORD` = `*Vallegroup23`
5. Marque: **✓ Production, Preview, Development**
6. **Redeploy** o projeto

---

### 7. **Contato com Suporte da Hospedagem**

Se nada funcionar, entre em contato com o suporte da hospedagem (Odin7080) e pergunte:

1. **Qual a URL correta da API do cPanel?**
   - Confirme se é `https://br.odin7080.com.br:2083`

2. **O usuário `valle360com` tem permissões para criar emails via API?**
   - Pode precisar habilitar "API Token" ou "API Access"

3. **Existe algum firewall bloqueando requisições?**
   - Forneça o IP do servidor Vercel se necessário

4. **Qual versão do cPanel está instalada?**
   - A API pode variar entre versões

---

## 📞 Suporte

Se precisar de ajuda adicional:

1. Verifique os logs no terminal (agora muito mais detalhados)
2. Copie a mensagem de erro completa
3. Verifique a seção "debugInfo" na resposta JSON
4. Entre em contato com o suporte técnico da hospedagem

---

## ✅ Checklist Final

- [ ] Credenciais do cPanel verificadas manualmente
- [ ] Login manual no cPanel funcionando
- [ ] Teste via curl retornando JSON
- [ ] Domínio `valle360.com.br` existe no cPanel
- [ ] Usuário tem permissões para criar emails
- [ ] Logs detalhados sendo exibidos no terminal
- [ ] Teste de criação de colaborador bem-sucedido
- [ ] Variáveis adicionadas na Vercel (produção)

---

**Última atualização:** 2026-02-05
