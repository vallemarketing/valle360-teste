# 🚨 COLABORADORES NÃO APARECEM NA LISTA - DIAGNÓSTICO COMPLETO

## 📋 O QUE ESTÁ ACONTECENDO

Você está criando colaboradores, mas eles **NÃO aparecem na lista** quando você:
1. Vai em "Mensagens" > aba "Equipe"
2. Clica em "Nova Conversa"
3. O modal abre VAZIO (sem nenhum colaborador para selecionar)

## 🔍 POSSÍVEIS CAUSAS

### 1. **user_profiles não está sendo criado** ⚠️ MAIS PROVÁVEL
   - Quando você cria um colaborador, o sistema deveria criar:
     1. `auth.users` (usuário de autenticação)
     2. `employees` (dados do colaborador)
     3. `user_profiles` (perfil para mensagens) ← **AQUI PODE ESTAR O PROBLEMA**
   
   - Se `user_profiles` não for criado, o colaborador **não aparece** na lista

### 2. **is_active está FALSE**
   - O `user_profiles` pode ter sido criado mas com `is_active = false`
   - A query só busca `is_active = true`

### 3. **user_type está NULL ou vazio**
   - Se `user_type` for NULL ou vazio, o filtro "team" remove o usuário

### 4. **RLS (Row Level Security) está bloqueando**
   - Mesmo com RLS desabilitado, pode haver outra política bloqueando

## 🧪 PASSO A PASSO PARA DIAGNOSTICAR

### PASSO 1: Execute o SQL de Verificação

1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Cole o conteúdo de `supabase/verificar_user_profiles.sql`
4. Execute
5. **ME ENVIE UM PRINT DE TODOS OS RESULTADOS**

Isso vai mostrar:
- Quantos colaboradores existem
- Quantos user_profiles existem
- Quais colaboradores estão SEM user_profile
- Quais user_profiles estão ativos

### PASSO 2: Recarregue a Aplicação

1. Salve todas as alterações
2. Reinicie o servidor (Ctrl+C no terminal e `npm run dev`)
3. No navegador, limpe o cache (Ctrl+Shift+R)
4. Abra o Console (F12)
5. Vá em "Mensagens" > "Equipe" > clique "Nova Conversa"

### PASSO 3: Analise os Logs

Agora o modal tem logs MUITO detalhados. Procure por:

```
🔍 ========== INICIANDO BUSCA DE USUÁRIOS ==========
```

Você verá:
- Quantos user_profiles foram retornados do banco
- Os dados brutos de cada usuário
- Quantos passaram no filtro "team"
- Quantos sobraram depois de excluir você mesmo

**ME ENVIE UM PRINT COMPLETO DO CONSOLE**

## 🎯 SOLUÇÕES BASEADAS NO DIAGNÓSTICO

### Se o problema for: "user_profiles não existe para os colaboradores"

**Solução**: Rode o SQL que já foi criado antes:
```sql
-- Inserir user_profiles para colaboradores que não têm
INSERT INTO user_profiles (
  user_id, 
  full_name, 
  email, 
  user_type, 
  avatar_url, 
  is_active
)
SELECT 
  u.id as user_id,
  e.name as full_name,
  e.email,
  COALESCE(e.position, 'employee')::text as user_type,
  NULL as avatar_url,
  true as is_active
FROM auth.users u
INNER JOIN employees e ON e.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE up.id IS NULL;
```

### Se o problema for: "is_active está FALSE"

**Solução**:
```sql
UPDATE user_profiles 
SET is_active = true 
WHERE user_type != 'client';
```

### Se o problema for: "user_type está NULL"

**Solução**:
```sql
UPDATE user_profiles up
SET user_type = COALESCE(e.position, 'employee')
FROM employees e
WHERE e.user_id = up.user_id 
AND (up.user_type IS NULL OR up.user_type = '');
```

### Se o problema for: "RLS está bloqueando"

**Solução**: Já desativamos RLS, mas vamos verificar se há outras políticas:
```sql
-- Ver todas as políticas ativas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE tablename IN ('user_profiles', 'employees', 'direct_conversations');
```

## 📊 LOGS QUE EU PRECISO VER

Para resolver de vez, me envie:

1. **Print do Supabase** com os resultados de `verificar_user_profiles.sql`
2. **Print do Console** quando você clicar em "Nova Conversa"
3. **Print da aba Network** mostrando a requisição para `user_profiles`

Com isso vou saber EXATAMENTE onde está o problema.

## 🚀 DEPOIS DE CORRIGIR

Quando os dados estiverem corretos no banco:
1. Recarregue a página
2. Clique em "Nova Conversa"
3. Você deveria ver a lista de colaboradores
4. Clique em um colaborador para iniciar a conversa
5. O colaborador vai aparecer na lista da esquerda
