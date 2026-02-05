# 🚀 GUIA RÁPIDO - Iniciar com Docker

## ⚡ INÍCIO RÁPIDO (3 passos)

### 1️⃣ Configure as credenciais

```bash
# Criar arquivo .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
OPENAI_API_KEY=sk-sua-openai-key-aqui
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
```

**Ou edite manualmente:**
```bash
nano .env.local
```

---

### 2️⃣ Build e Start

**OPÇÃO A - Script Automático (Recomendado):**
```bash
./scripts/docker-start.sh
```

**OPÇÃO B - Manual:**
```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Ver logs
docker-compose logs -f valle360-app
```

---

### 3️⃣ Acesse o sistema

```
🌐 http://localhost:3000
📊 http://localhost:3000/api/health
```

---

## 📋 COMANDOS PRINCIPAIS

### Iniciar
```bash
docker-compose up -d
```

### Ver logs
```bash
docker-compose logs -f valle360-app
```

### Ver status
```bash
docker-compose ps
```

### Parar
```bash
docker-compose down
```

### Parar (com script)
```bash
./scripts/docker-stop.sh
```

### Rebuild
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 🛠️ MODO DESENVOLVIMENTO

```bash
# Start em modo dev (com hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Acessos:
# - Next.js: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Mailhog (email testing): http://localhost:8025
# - Redis: localhost:6379

# Logs
docker-compose -f docker-compose.dev.yml logs -f valle360-dev

# Stop
docker-compose -f docker-compose.dev.yml down
```

---

## ✅ CHECKLIST

- [ ] Docker Desktop instalado e rodando
- [ ] Arquivo `.env.local` criado com credenciais
- [ ] Build da imagem: `docker-compose build`
- [ ] Start: `docker-compose up -d`
- [ ] Acessar: http://localhost:3000
- [ ] Verificar health: http://localhost:3000/api/health

---

## 🚨 PROBLEMAS COMUNS

### Erro: "Cannot find module"
```bash
# Rebuild sem cache
docker-compose build --no-cache
docker-compose up -d
```

### Erro: "Port 3000 already in use"
```bash
# Ver o que está usando a porta
lsof -i :3000

# Matar processo
kill -9 <PID>

# Ou mudar porta no docker-compose.yml
```

### Container não inicia
```bash
# Ver logs
docker-compose logs valle360-app

# Verificar .env.local
cat .env.local

# Restart
docker-compose restart valle360-app
```

---

## 📖 GUIA COMPLETO

Para todos os comandos e detalhes, veja:
👉 **`🐳_DOCKER_COMANDOS.md`**








