# 🚀 GUIA RÁPIDO: Como Executar as Migrations do Valle 360

## ⚡ Execução Rápida (Recomendado)

### Usando Supabase CLI

```bash
# 1. Navegue até o diretório do projeto
cd /Users/imac/Desktop/N8N/valle-360

# 2. Verifique se está linkado ao projeto Supabase
supabase status

# 3. Execute TODAS as migrations de uma vez
supabase db push

# ✅ Pronto! Todas as 13 migrations serão executadas em ordem.
```

---

## 📋 Execução Manual (Alternativa)

### Opção 1: Via Supabase Dashboard

1. Acesse: https://app.supabase.com
2. Selecione seu projeto Valle 360
3. Vá em **SQL Editor**
4. Copie e cole cada migration **na ordem abaixo**
5. Execute uma por vez (clique em "Run")

**⚠️ ORDEM OBRIGATÓRIA**:

```
1. 20251112000000_init_database_functions.sql       ⬅️ PRIMEIRO!
2. 20251112000001_create_user_system.sql
3. 20251112000002_create_clients_system.sql
4. 20251112000003_create_credits_financial_system.sql
5. 20251112000004_create_production_system.sql
6. 20251112000005_create_kanban_system.sql
7. 20251112000006_create_messaging_system.sql
8. 20251112000007_create_calendar_files_systems.sql
9. 20251112000008_create_employees_hr_system.sql
10. 20251112000009_create_financial_system.sql
11. 20251112000010_create_dashboards_metrics_system.sql
12. 20251112000011_create_ai_notifications_audit_system.sql
13. 20251112000012_create_complementary_tables.sql  ⬅️ ÚLTIMO!
```

### Opção 2: Via psql (Terminal)

```bash
# 1. Obter credenciais do Supabase
# Dashboard → Settings → Database → Connection String

# 2. Executar migrations em ordem
cd /Users/imac/Desktop/N8N/valle-360/supabase/migrations

psql "postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres" \
  -f 20251112000000_init_database_functions.sql

psql "postgresql://..." -f 20251112000001_create_user_system.sql
psql "postgresql://..." -f 20251112000002_create_clients_system.sql
# ... continue para todas as 13 migrations
```

---

## ✅ Validação Após Execução

### 1. Verificar Tabelas Criadas

```sql
-- Execute no SQL Editor do Supabase
SELECT 
  schemaname, 
  tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Esperado: ~100+ tabelas
```

### 2. Verificar RLS Habilitado

```sql
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;

-- Esperado: TODAS as tabelas com rowsecurity = true
```

### 3. Verificar Funções Criadas

```sql
SELECT 
  proname AS function_name
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
ORDER BY proname;

-- Esperado: update_updated_at_column, validate_cpf, validate_cnpj, etc.
```

### 4. Verificar Extensões

```sql
SELECT * FROM pg_extension;

-- Esperado: uuid-ossp, pgcrypto, unaccent
```

### 5. Verificar Políticas RLS

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Esperado: Múltiplas políticas por tabela
```

---

## 🐛 Troubleshooting

### ❌ Erro: "function update_updated_at_column() does not exist"

**Solução**: Você esqueceu de executar a migration `000` primeiro!

```bash
# Execute a migration inicial
supabase db push 20251112000000_init_database_functions.sql
```

### ❌ Erro: "relation X does not exist"

**Solução**: Ordem de execução errada. Recomece do zero:

```bash
# Reset do banco (CUIDADO: Apaga tudo!)
supabase db reset

# Execute novamente
supabase db push
```

### ❌ Erro: "permission denied for schema public"

**Solução**: Problema de permissões. Execute como superuser:

```sql
-- No SQL Editor do Supabase
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### ❌ Erro: "duplicate key value violates unique constraint"

**Solução**: Banco já tem dados. Duas opções:

**Opção A**: Limpar banco (desenvolvimento)
```bash
supabase db reset
supabase db push
```

**Opção B**: Adaptar migrations (produção)
```sql
-- Use CREATE TABLE IF NOT EXISTS
-- Use ALTER TABLE IF EXISTS
-- Faça backup antes!
```

---

## 📊 Monitoramento

### Ver Logs Durante Execução

```bash
# Terminal 1: Executar migrations
supabase db push

# Terminal 2: Ver logs em tempo real
supabase logs db
```

### Verificar Tamanho do Banco

```sql
SELECT 
  pg_size_pretty(pg_database_size('postgres')) AS database_size;
```

### Verificar Tabelas Maiores

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

---

## 🌱 Dados Iniciais (Seeds)

Após executar as migrations, popule dados iniciais:

### 1. Criar Super Admin

```sql
-- Execute no SQL Editor
-- IMPORTANTE: Substitua os valores abaixo

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'admin@valle360.com',
  '{"full_name": "Super Admin"}'::jsonb
);

-- O trigger criará automaticamente o user_profile
```

### 2. Categorias de Serviços

```sql
INSERT INTO service_categories (name, description, icon, color) VALUES
('Social Media', 'Gestão de redes sociais', 'instagram', '#E1306C'),
('Design Gráfico', 'Criação de peças visuais', 'palette', '#FF6B6B'),
('Vídeo', 'Produção de vídeos', 'video', '#4ECDC4'),
('Web', 'Desenvolvimento web', 'code', '#95E1D3'),
('Tráfego Pago', 'Gestão de anúncios', 'trending-up', '#F38181'),
('SEO', 'Otimização para buscadores', 'search', '#AA96DA');
```

### 3. Áreas de Colaboradores

```sql
INSERT INTO employee_areas (name, description, color, icon) VALUES
('Social Media', 'Gestão de redes sociais', '#E1306C', 'instagram'),
('Design', 'Design gráfico e criação', '#FF6B6B', 'palette'),
('Vídeo', 'Produção de vídeo', '#4ECDC4', 'video'),
('Web', 'Desenvolvimento web', '#95E1D3', 'code'),
('Comercial', 'Vendas e comercial', '#F38181', 'briefcase'),
('Financeiro', 'Gestão financeira', '#AA96DA', 'dollar-sign'),
('RH', 'Recursos humanos', '#FCBAD3', 'users');
```

### 4. Conquistas de Gamificação

```sql
INSERT INTO gamification_achievements (achievement_name, achievement_description, achievement_type, icon, points_awarded, criteria) VALUES
('Primeira Meta Alcançada', 'Completou sua primeira meta', 'employee', 'trophy', 100, '{"type": "goals_hit", "value": 1}'::jsonb),
('Streak de 7 Dias', 'Manteve performance por 7 dias seguidos', 'employee', 'fire', 200, '{"type": "streak", "value": 7}'::jsonb),
('Cliente Satisfeito', 'Recebeu avaliação NPS 9 ou 10', 'client', 'smile', 50, '{"type": "nps", "value": 9}'::jsonb),
('Indicação Convertida', 'Indicou um cliente que converteu', 'client', 'gift', 300, '{"type": "referral_converted", "value": 1}'::jsonb);
```

---

## 📱 Integração com Frontend

### Configurar Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Exemplo de Query

```typescript
// Buscar clientes do usuário autenticado
const { data: clients, error } = await supabase
  .from('clients')
  .select('*')
  .order('created_at', { ascending: false })

// O RLS garante que só verá os dados permitidos!
```

---

## 🔐 Configuração de Autenticação

### Habilitar Provedores no Supabase

1. Dashboard → Authentication → Providers
2. Habilite: Email, Google, etc.
3. Configure callbacks

### Configurar Email Templates

1. Dashboard → Authentication → Email Templates
2. Personalize templates de:
   - Confirmação de email
   - Redefinição de senha
   - Convite

---

## 🎯 Próximos Passos

1. ✅ Executar migrations → `supabase db push`
2. ✅ Validar estrutura → Queries de validação acima
3. ✅ Popular dados iniciais → Seeds acima
4. ✅ Configurar autenticação → Providers
5. ✅ Conectar frontend → Supabase client
6. ✅ Testar RLS → Criar usuários de teste
7. ✅ Implementar APIs → Endpoints REST
8. ✅ Deploy! 🚀

---

## 📞 Suporte

- **Documentação Supabase**: https://supabase.com/docs
- **Discord Supabase**: https://discord.supabase.com
- **Stack Overflow**: Tag `supabase`

---

## ⚠️ IMPORTANTE

### Antes de Executar em Produção:

1. ✅ Faça **backup completo** do banco
2. ✅ Teste em ambiente de **staging** primeiro
3. ✅ Valide **todas as políticas RLS**
4. ✅ Configure **rate limiting**
5. ✅ Configure **logs e monitoramento**
6. ✅ Documente **credenciais** em local seguro

### Segurança:

- 🔒 Nunca commite credenciais no Git
- 🔒 Use variáveis de ambiente
- 🔒 Habilite 2FA no Supabase
- 🔒 Configure IP whitelist se possível
- 🔒 Revise políticas RLS periodicamente

---

**Boa sorte com o deploy! 🚀**

*Se encontrar problemas, consulte o README.md na pasta migrations ou a documentação completa.*

