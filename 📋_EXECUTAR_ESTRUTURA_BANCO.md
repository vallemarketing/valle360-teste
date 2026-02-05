# 📋 GUIA: Aplicar Estrutura do Banco de Dados

## ✅ CREDENCIAIS ATUALIZADAS

```
Projeto: ojlcvpqhbfnehuferyci
URL: https://ojlcvpqhbfnehuferyci.supabase.co
Senha: <DB_PASSWORD>
```

✅ `.env.local` já foi atualizado automaticamente!

---

## 🚀 PASSOS PARA APLICAR A ESTRUTURA

### **Opção 1: Via SQL Editor (Recomendado)**

#### **Passo 1: Abra o SQL Editor**
🔗 https://supabase.com/dashboard/project/ojlcvpqhbfnehuferyci/sql/new

#### **Passo 2: Execute a Estrutura do Banco**

1. Copie o conteúdo do arquivo: `/Users/imac/Desktop/N8N/Downloads/supabase_database_structure.sql`
2. Cole no SQL Editor
3. Clique em **"Run"**
4. Aguarde ~2-3 minutos

**O que será criado:**
- ✅ 30+ tabelas (users, clients, employees, kanban, etc)
- ✅ Todos os índices
- ✅ Triggers automáticos
- ✅ Row Level Security (RLS)
- ✅ Políticas de segurança

#### **Passo 3: Criar Usuário Admin**

1. No mesmo SQL Editor
2. Copie o conteúdo de: `/Users/imac/Desktop/N8N/valle-360/supabase/criar_admin_novo.sql`
3. Cole e execute
4. Aguarde a mensagem: ✅ ADMIN CRIADO COM SUCESSO!

---

### **Opção 2: Via psql (Terminal)**

```bash
# Conectar ao banco
psql postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# Dentro do psql, executar:
\i /Users/imac/Desktop/N8N/Downloads/supabase_database_structure.sql
\i /Users/imac/Desktop/N8N/valle-360/supabase/criar_admin_novo.sql

# Sair
\q
```

---

## 📊 ESTRUTURA QUE SERÁ CRIADA

### **Principais Tabelas:**

#### **Autenticação e Usuários**
- `user_profiles` - Perfis de usuários
- `users` - Dados de usuários
- `employees` - Colaboradores
- `clients` - Clientes

#### **Kanban e Projetos**
- `kanban_boards` - Quadros
- `kanban_columns` - Colunas
- `kanban_tasks` - Tarefas
- `kanban_task_comments` - Comentários

#### **Mensagens**
- `client_messages` - Mensagens de clientes
- `ai_message_suggestions` - Sugestões da IA

#### **Financeiro**
- `contracts` - Contratos
- `invoices` - Faturas
- `financial_transactions` - Transações

#### **Gamificação**
- `employee_gamification` - Pontos e níveis
- `employee_achievements` - Conquistas
- `employee_referral_codes` - Códigos de indicação
- `client_referrals` - Indicações

#### **IA e ML**
- `ai_chat_history` - Histórico Val
- `employee_churn_predictions` - Predições
- `ml_models` - Modelos ML

#### **Outros**
- `calendar_events` - Eventos
- `calendar_participants` - Participantes
- `employee_requests` - Solicitações
- `client_metrics` - Métricas
- `files` - Arquivos
- `audit_logs` - Auditoria
- `system_settings` - Configurações

---

## ✅ VERIFICAR SE DEU CERTO

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT COUNT(*) as total_tabelas 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Deve retornar: ~30 tabelas

-- Verificar se admin existe
SELECT email, role 
FROM auth.users 
WHERE email = 'guilherme@vallegroup.com.br';
-- Deve retornar: 1 linha

-- Verificar perfil
SELECT full_name, email, role, user_type 
FROM user_profiles 
WHERE email = 'guilherme@vallegroup.com.br';
-- Deve retornar: 1 linha

-- Verificar employee
SELECT full_name, email, position 
FROM employees 
WHERE email = 'guilherme@vallegroup.com.br';
-- Deve retornar: 1 linha
```

---

## 🔑 LOGIN

Após aplicar tudo:

```
URL: http://localhost:3000/login
Email: guilherme@vallegroup.com.br
Senha: *Valle2307
```

---

## 🚨 SE DER ERRO

### **"relation already exists"**
✅ Normal! Significa que a tabela já existe. Continue.

### **"function crypt does not exist"**
Execute antes:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### **"permission denied"**
Use o SQL Editor com a service_role key (já configurado).

---

## 📝 RESUMO

1. ✅ .env.local atualizado ✓
2. ⏳ Execute: supabase_database_structure.sql
3. ⏳ Execute: criar_admin_novo.sql
4. ⏳ Teste o login

---

## 🎯 LINKS IMPORTANTES

- **Dashboard:** https://supabase.com/dashboard/project/ojlcvpqhbfnehuferyci
- **SQL Editor:** https://supabase.com/dashboard/project/ojlcvpqhbfnehuferyci/sql/new
- **API Settings:** https://supabase.com/dashboard/project/ojlcvpqhbfnehuferyci/settings/api
- **Database:** https://supabase.com/dashboard/project/ojlcvpqhbfnehuferyci/database/tables

---

**Depois de executar, reinicie o servidor:**

```bash
cd /Users/imac/Desktop/N8N/valle-360
# Parar servidor (Ctrl+C se estiver rodando)
npm run dev
```

**E acesse:** http://localhost:3000/login







