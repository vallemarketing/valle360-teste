# Instruções de Reset e Login

## Status Atual
O usuário **designer@valle360.com** foi completamente resetado e recriado no banco de dados remoto. Todas as tabelas (`auth`, `employees`, `user_profiles`) estão sincronizadas.

## Credenciais
- **Email:** designer@valle360.com
- **Senha:** Valle@2024

## Passos para Liberar Acesso Local

Como houve mudanças na estrutura do banco e nas variáveis de ambiente, é essencial limpar o cache do Next.js para evitar erros de "permissão negada" ou leituras antigas.

Execute os seguintes comandos no seu terminal:

```bash
# 1. Parar o servidor atual (Ctrl+C no terminal onde está rodando 'npm run dev')

# 2. Limpar cache do Next.js e dependências
rm -rf .next
rm -rf node_modules/.cache

# 3. Reiniciar o servidor
npm run dev
```

## Teste
Após reiniciar, acesse:
1. http://localhost:3000/login
2. Use as credenciais acima.
3. Você deve ser redirecionado para o Dashboard do Designer.

## Nota sobre Variáveis de Ambiente
Detectamos que a variável `SUPABASE_SERVICE_ROLE_KEY` não está definida no seu arquivo `.env.local`.
- Isso impede que scripts de manutenção locais (como reset de usuários) funcionem totalmente.
- No entanto, o reset remoto foi realizado com sucesso via conexão direta do Cursor.
- Para scripts futuros, considere adicionar essa chave ao seu `.env.local`.

