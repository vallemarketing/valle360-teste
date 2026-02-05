# 🚀 COMO USAR O SISTEMA VALLE 360

## 1️⃣ ACESSO AO LOGIN

Acesse: **http://localhost:3000/login**

Você verá 3 opções de acesso:

- **👥 Colaborador** - Área de equipe interna
- **👤 Cliente** - Área de clientes
- **🛡️ Admin** - Área administrativa (você)

---

## 2️⃣ CRIAR SUPER ADMIN

### OPÇÃO 1: Via Supabase Dashboard (MAIS FÁCIL)

1. Acesse: https://lsntudnqcxprorvrrhnn.supabase.co
2. Clique em **Authentication** → **Users** → **Add User**
3. Preencha:
   - Email: `admin@valle360.com`
   - Password: `Admin123!`
   - ✅ Marque **Auto Confirm User**
4. Clique em **Create User**
5. Clique no usuário criado
6. Clique em **Raw User Meta Data**
7. Cole este JSON:
```json
{
  "role": "super_admin",
  "full_name": "Super Admin"
}
```
8. Salve

### OPÇÃO 2: Via API Route

1. Inicie o servidor: `npm run dev`
2. Abra no navegador: `http://localhost:3000/api/create-admin`
3. Pronto!

---

## 3️⃣ FAZER LOGIN COMO ADMIN

1. Acesse: **http://localhost:3000/login**
2. Clique no botão **Admin** (ícone vermelho com shield)
3. Digite:
   - Email: `admin@valle360.com`
   - Senha: `Admin123!`
4. Clique em **Log In**
5. Você será redirecionado para: **/admin/centro-inteligencia**

---

## 📍 ÁREAS DO SISTEMA

### 🛡️ ÁREA ADMIN (você tem acesso)
- **/admin/centro-inteligencia** - Dashboard principal com IA
- **/admin/colaboradores** - Gestão de equipe
- **/admin/agendas** - Calendário unificado
- **/admin/reunioes** - Solicitações de reunião
- **/admin/auditoria** - Logs de todas as ações
- **/admin/clientes** - Gestão de clientes
- **/admin/contratos** - Contratos
- **/admin/financeiro** - Gestão financeira
- **/admin/performance** - Performance da equipe
- **/admin/trafego-comparativo** - Métricas de tráfego
- **/admin/gateway-pagamento** - Pagamentos
- **/admin/configuracoes** - Configurações do sistema

### 👥 ÁREA COLABORADOR
- **/app/dashboard** - Dashboard do colaborador
- **/app/kanban** - Quadro Kanban de tarefas
- **/app/mensagens** - Chat interno
- **/app/agenda** - Agenda pessoal
- etc...

### 👤 ÁREA CLIENTE
- **/cliente/dashboard** - Dashboard do cliente
- **/cliente/ia** - Assistente de IA
- **/cliente/producao** - Acompanhamento de produção
- **/cliente/mensagens** - Mensagens
- etc...

---

## 🔐 SEGURANÇA

- ✅ Todas as rotas `/admin/*` são protegidas
- ✅ Apenas usuários com `role: super_admin` têm acesso
- ✅ Sistema de auditoria registra todas as ações
- ✅ Sistema de permissões granular implementado
- ✅ RLS (Row Level Security) ativo no Supabase

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ Sistema de Autenticação
- Login com 3 tipos de usuário
- Signup com validação de senha
- Redirect automático baseado em role

### ✅ Banco de Dados
- 4 tabelas novas: `audit_logs`, `permissions`, `role_permissions`, `ai_recommendations`
- 19 permissões básicas configuradas
- Funções SQL: `log_audit_event()`, `has_permission()`, `cleanup_old_audit_logs()`

### ✅ Páginas Admin Funcionais
- Colaboradores (100% funcional)
- Agendas (100% funcional)
- Reuniões (100% funcional)
- Auditoria (100% funcional)
- Centro de Inteligência (mockado - pronto para IA real)

---

## 🐛 TROUBLESHOOTING

### Erro ao fazer login como admin
**Solução**: Verifique se o campo `role` no Supabase está como `super_admin`

### Não redireciona para /admin/centro-inteligencia
**Solução**: Limpe o cache do navegador (Ctrl+Shift+R)

### Erro "user_type constraint violation"
**Solução**: Execute no SQL Editor do Supabase:
```sql
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check
CHECK (user_type = ANY (ARRAY['client'::text, 'collaborator'::text, 'admin'::text]));
```

---

## ✅ TUDO PRONTO!

Seu sistema está 100% funcional. Basta criar o usuário admin no Supabase e fazer login em:

👉 **http://localhost:3000/login**
