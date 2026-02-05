# 🚨 LEONARDO E GUSTAVO NÃO APARECEM NA LISTA

## 📊 SITUAÇÃO ATUAL

**Colaboradores cadastrados:** 4
- ✅ Shane Santiago - APARECE
- ✅ João Viana - APARECE  
- ❌ Leonardo Augusto - NÃO APARECE
- ❌ Gustavo Mendes - NÃO APARECE

## 🔍 POSSÍVEIS CAUSAS

Leonardo e Gustavo podem não aparecer porque:

1. **`user_profiles` não existe para eles**
   - Foram criados antes da correção do código
   - O `user_profiles` não foi criado na hora

2. **`is_active = false`**
   - Estão marcados como inativos

3. **`user_type` está NULL ou vazio**
   - O filtro "Equipe" remove usuários sem tipo

4. **`user_type = 'client'`**
   - Foram marcados como cliente por engano

## ✅ SOLUÇÃO RÁPIDA (2 PASSOS)

### PASSO 1: DIAGNÓSTICO

No Supabase Dashboard → SQL Editor, execute:

```
supabase/verificar_colaboradores_especificos.sql
```

Isso vai mostrar:
- Se Leonardo e Gustavo existem em `employees`
- Se existem em `auth.users`
- Se existem em `user_profiles`
- Se passam no filtro da query

**ME ENVIE UM PRINT DO RESULTADO**

### PASSO 2: CORREÇÃO AUTOMÁTICA

No mesmo SQL Editor, execute TODO o conteúdo de:

```
supabase/corrigir_leonardo_gustavo.sql
```

Isso vai:
1. Criar `user_profiles` se não existir
2. Ativar se estiver inativo
3. Corrigir `user_type` se estiver vazio
4. Mostrar o status final

## 🧪 TESTAR DEPOIS

1. **Recarregue a página** (Ctrl+Shift+R)
2. **Vá em Mensagens → Equipe**
3. **Clique em "Nova Conversa"**

Agora os 4 colaboradores deveriam aparecer:
- Leonardo Augusto
- João Viana
- Gustavo Mendes
- Shane Santiago

## 🎯 SE AINDA NÃO APARECER

Abra o Console (F12) e procure por:

```
🔍 ========== INICIANDO BUSCA DE USUÁRIOS ==========
```

Os logs vão mostrar:
- Quantos `user_profiles` foram encontrados
- Quantos passaram no filtro "team"
- A lista final

**ME ENVIE UM PRINT DO CONSOLE**

## 🔧 CORREÇÃO MANUAL (SE NECESSÁRIO)

Se o SQL automático não funcionar, execute manualmente:

```sql
-- Para Leonardo
INSERT INTO user_profiles (user_id, full_name, email, user_type, is_active)
SELECT u.id, 'Leonardo Augusto', 'leonardo@valle360.com.br', 'employee', true
FROM auth.users u
WHERE u.email = 'leonardo@valle360.com.br'
  AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id);

-- Para Gustavo  
INSERT INTO user_profiles (user_id, full_name, email, user_type, is_active)
SELECT u.id, 'Gustavo Mendes', 'gustavo@valle360.com.br', 'employee', true
FROM auth.users u
WHERE u.email = 'gustavo@valle360.com.br'
  AND NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = u.id);
```

## 📝 RESUMO

1. Execute `verificar_colaboradores_especificos.sql` → Me envie print
2. Execute `corrigir_leonardo_gustavo.sql` → Vai corrigir automaticamente
3. Recarregue a página e teste
4. Se não funcionar, me envie print do console

---

**Arquivos criados:**
- `supabase/verificar_colaboradores_especificos.sql` - Diagnóstico detalhado
- `supabase/corrigir_leonardo_gustavo.sql` - Correção automática
- `PROBLEMA_LEONARDO_GUSTAVO.md` - Este guia
