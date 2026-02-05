# Plano de Correção de Login

Este plano contém os passos exatos para corrigir o erro de login e iniciar o sistema.

## 1. Correção do Banco de Dados (JÁ EXECUTADO)
O usuário `designer@valle360.com` foi recriado com sucesso no banco de dados usando a estrutura correta das tabelas (`auth.users`, `employees`, `user_profiles`, `users`).

- **Status:** ✅ Concluído.
- **Senha:** `Valle@2024`

## 2. Correção do Ambiente Local (A FAZER)
O seu terminal está com caches antigos ou variáveis de ambiente erradas. Você precisa rodar um script de limpeza.

### Passo Único: Rodar Script de Reset Local
Copie e cole o seguinte comando no seu terminal:

```bash
cd ~/Desktop/N8N
bash scripts/reset-local-env.sh
npm run dev
```

## 3. Teste de Login
Após o servidor reiniciar (quando aparecer `Ready in ...`), acesse:

- **URL:** `http://localhost:3000/login`
- **Email:** `designer@valle360.com`
- **Senha:** `Valle@2024`

Se o login funcionar, o Dashboard do Designer deve carregar com o novo layout.

