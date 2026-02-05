# 🐳 GUIA COMPLETO - Docker Commands

## 📋 PREPARAÇÃO INICIAL

### 1. Configure as variáveis de ambiente

```bash
# Copie o arquivo de exemplo
cp .env.docker.example .env.local

# Edite com suas credenciais reais
nano .env.local
# ou
code .env.local
```

**Variáveis obrigatórias:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...sua-key-aqui
OPENAI_API_KEY=sk-...sua-key-aqui
```

---

## 🚀 MODO PRODUÇÃO

### Comandos Principais

```bash
# 1. Build da imagem Docker
docker-compose build

# 2. Iniciar todos os serviços
docker-compose up -d

# 3. Ver logs em tempo real
docker-compose logs -f valle360-app

# 4. Ver status dos containers
docker-compose ps

# 5. Parar todos os serviços
docker-compose down

# 6. Parar e remover volumes (CUIDADO: apaga dados)
docker-compose down -v
```

### Build e Deploy Completo

```bash
# Build fresh (sem cache)
docker-compose build --no-cache

# Start em background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar health
curl http://localhost:3000/api/health
```

### Acessar o Sistema

```
🌐 Aplicação: http://localhost:3000
📊 Health Check: http://localhost:3000/api/health
```

---

## 🛠️ MODO DESENVOLVIMENTO

### Iniciar Ambiente de Dev

```bash
# Start todos os serviços de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Ver logs do Next.js
docker-compose -f docker-compose.dev.yml logs -f valle360-dev

# Stop todos os serviços
docker-compose -f docker-compose.dev.yml down
```

### Serviços Disponíveis (Dev)

```
🌐 Next.js Dev: http://localhost:3000
🗄️ PostgreSQL: localhost:5432
📮 Mailhog (Email testing): http://localhost:8025
📦 Redis: localhost:6379
```

### Acessar PostgreSQL (Dev)

```bash
# Via docker exec
docker exec -it valle360-postgres-dev psql -U postgres -d valle360_dev

# Via cliente local
psql -h localhost -p 5432 -U postgres -d valle360_dev
```

---

## 🔧 COMANDOS ÚTEIS

### Gerenciamento de Containers

```bash
# Ver todos os containers (rodando e parados)
docker ps -a

# Parar container específico
docker stop valle360-app

# Iniciar container específico
docker start valle360-app

# Restart container
docker restart valle360-app

# Remover container
docker rm valle360-app

# Entrar no container (shell)
docker exec -it valle360-app sh
```

### Logs e Debug

```bash
# Ver logs do app
docker-compose logs valle360-app

# Últimas 100 linhas
docker-compose logs --tail=100 valle360-app

# Seguir logs em tempo real
docker-compose logs -f valle360-app

# Ver logs de todos os serviços
docker-compose logs -f
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não usadas
docker image prune -a

# Remover volumes não usados
docker volume prune

# Limpeza geral (CUIDADO!)
docker system prune -a --volumes
```

### Rebuild Específico

```bash
# Rebuild apenas o app
docker-compose build valle360-app

# Rebuild e restart
docker-compose up -d --build valle360-app

# Force rebuild (sem cache)
docker-compose build --no-cache valle360-app
```

---

## 📊 MONITORAMENTO

### Status dos Serviços

```bash
# Ver status de todos os serviços
docker-compose ps

# Ver uso de recursos
docker stats

# Ver uso de recursos (específico)
docker stats valle360-app
```

### Health Checks

```bash
# Via curl
curl http://localhost:3000/api/health

# Via HTTPie (se instalado)
http :3000/api/health

# Ver health check do container
docker inspect --format='{{json .State.Health}}' valle360-app | jq
```

---

## 🗄️ BANCO DE DADOS

### Aplicar Migrações (Supabase Cloud)

```bash
# Dentro do container
docker exec -it valle360-app sh

# Depois dentro do container
npm run supabase db reset
```

### Backup e Restore (Se usar PostgreSQL local)

```bash
# Backup
docker exec valle360-postgres-dev pg_dump -U postgres valle360_dev > backup.sql

# Restore
docker exec -i valle360-postgres-dev psql -U postgres valle360_dev < backup.sql
```

---

## 🔄 ATUALIZAÇÃO DA APLICAÇÃO

### Workflow de Deploy

```bash
# 1. Pull novas alterações
git pull origin main

# 2. Stop containers
docker-compose down

# 3. Rebuild
docker-compose build --no-cache

# 4. Start
docker-compose up -d

# 5. Ver logs
docker-compose logs -f valle360-app
```

### Hot Reload (Development)

```bash
# Em dev, as alterações são automáticas
# Os arquivos estão montados como volume
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f valle360-dev
```

---

## 🚨 TROUBLESHOOTING

### Container não inicia

```bash
# Ver logs completos
docker-compose logs valle360-app

# Ver últimos erros
docker-compose logs --tail=50 valle360-app

# Verificar configuração
docker-compose config

# Rebuild forçado
docker-compose build --no-cache
docker-compose up -d
```

### Erro de porta em uso

```bash
# Ver o que está usando a porta 3000
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou mudar porta no docker-compose.yml
# ports:
#   - "3001:3000"  # host:container
```

### Erro de variáveis de ambiente

```bash
# Verificar .env.local existe
ls -la .env.local

# Ver variáveis no container
docker exec valle360-app env | grep SUPABASE

# Restart com novas env vars
docker-compose up -d --force-recreate
```

### Limpar tudo e recomeçar

```bash
# CUIDADO: Remove tudo!
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d --build
```

---

## 🎯 ATALHOS ÚTEIS

### Criar aliases (opcional)

Adicione ao seu `~/.zshrc` ou `~/.bashrc`:

```bash
# Docker Compose shortcuts
alias dcu="docker-compose up -d"
alias dcd="docker-compose down"
alias dcl="docker-compose logs -f"
alias dcr="docker-compose restart"
alias dcb="docker-compose build"
alias dcp="docker-compose ps"

# Valle 360 specific
alias valle-start="cd /Users/imac/Desktop/N8N/valle-360 && docker-compose up -d"
alias valle-stop="cd /Users/imac/Desktop/N8N/valle-360 && docker-compose down"
alias valle-logs="cd /Users/imac/Desktop/N8N/valle-360 && docker-compose logs -f valle360-app"
alias valle-restart="cd /Users/imac/Desktop/N8N/valle-360 && docker-compose restart valle360-app"
```

Depois:
```bash
source ~/.zshrc
```

---

## 📝 CHECKLIST INICIAL

### Primeira vez rodando:

- [ ] 1. Copiar `.env.docker.example` para `.env.local`
- [ ] 2. Configurar credenciais Supabase
- [ ] 3. Configurar OpenAI API Key
- [ ] 4. Build da imagem: `docker-compose build`
- [ ] 5. Start containers: `docker-compose up -d`
- [ ] 6. Verificar logs: `docker-compose logs -f`
- [ ] 7. Acessar: http://localhost:3000
- [ ] 8. Testar health: http://localhost:3000/api/health

---

## 🔐 PRODUÇÃO (VPS/Cloud)

### Deploy em servidor

```bash
# No servidor (via SSH)
cd /var/www/valle360

# Pull código
git pull origin main

# Configure .env.local
nano .env.local

# Build e start
docker-compose build
docker-compose up -d

# Nginx reverse proxy (opcional)
# Configure nginx.conf para apontar para localhost:3000
```

### Com nginx reverse proxy

```nginx
# /etc/nginx/sites-available/valle360
server {
    listen 80;
    server_name valle360.com.br www.valle360.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎉 PRONTO PARA USAR!

**Comandos principais:**

```bash
# Start tudo
docker-compose up -d

# Ver o que está rodando
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down
```

**Acesse:** http://localhost:3000

---

## 📞 PRECISA DE AJUDA?

Se tiver qualquer erro, me envie:

```bash
# Output destes comandos:
docker-compose ps
docker-compose logs valle360-app
docker version
docker-compose version
```








