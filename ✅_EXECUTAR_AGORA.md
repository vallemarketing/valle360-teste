# ✅ EXECUTAR AGORA - Valle 360

## 🎯 STATUS ATUAL

### ✅ **PRONTO:**
- ✅ Docker configurado
- ✅ `.env.local` criado
- ✅ OpenAI Key configurada
- ✅ Supabase URL configurada
- ✅ Service Role Key configurada

### ❌ **FALTANDO:**
- ❌ **ANON PUBLIC KEY** do Supabase

---

## 🔑 PASSO 1: BUSCAR ANON KEY (2 minutos)

### **Acesse:**
🔗 https://supabase.com/dashboard/project/enzazswaehuawcugexbr/settings/api

### **Copie a key que está marcada como:**
```
🔓 anon public
<EXEMPLO_ANON_KEY>
```

**NÃO copie a service_role** (essa eu já tenho!)

---

## ⚡ PASSO 2: ATUALIZAR .env.local

```bash
cd /Users/imac/Desktop/N8N/valle-360
nano .env.local
```

**Procure esta linha:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=PRECISA_BUSCAR_ANON_KEY
```

**Substitua por:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...sua_anon_key_aqui...
```

**Salve:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 🚀 PASSO 3: BUILD E START (5 minutos)

```bash
# Certifique-se que está na pasta correta
cd /Users/imac/Desktop/N8N/valle-360

# Build da imagem Docker
docker-compose build

# Start dos containers
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f valle360-app
```

---

## 🌐 PASSO 4: ACESSAR

```
🌐 Sistema: http://localhost:3000
📊 Health: http://localhost:3000/api/health
```

**Login teste:**
```
Email: guilherme@vallegroup.com.br
Senha: <SENHA_DEFINIDA_NO_AMBIENTE>
```

*(Depois precisamos criar seu usuário no banco)*

---

## 🔄 OU ME MANDE A KEY

**Se quiser, me mande a ANON KEY e eu atualizo automaticamente!**

Será algo como:
```
<SUA_ANON_KEY_AQUI>
```

Note: Tem `"role":"anon"` (não service_role)

---

## 📊 COMANDOS ÚTEIS

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f

# Parar tudo
docker-compose down

# Restart
docker-compose restart

# Rebuild completo
docker-compose build --no-cache
docker-compose up -d
```

---

## 🚨 PROBLEMAS?

### Container não inicia:
```bash
docker-compose logs valle360-app
```

### Porta em uso:
```bash
lsof -i :3000
kill -9 <PID>
```

### Limpar e recomeçar:
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📞 PRECISA DE AJUDA?

**Me mande:**
1. A ANON KEY (para eu atualizar automaticamente)
2. Ou os logs de erro: `docker-compose logs valle360-app`

---

## 📖 DOCUMENTAÇÃO

- 🚀 **Guia rápido:** `🚀_INICIAR_DOCKER.md`
- 🐳 **Comandos completos:** `🐳_DOCKER_COMANDOS.md`
- ⚠️ **Como buscar ANON Key:** `⚠️_BUSCAR_ANON_KEY.md`
- 🚀 **Próximos passos:** `🚀_PROXIMOS_PASSOS_PRODUCAO.md`

---

## ✨ DEPOIS QUE RODAR

Precisamos:
1. ✅ Aplicar migrações no Supabase
2. ✅ Criar seu usuário admin
3. ✅ Testar login
4. ✅ Implementar dashboard admin
5. ✅ Integrar Val (IA) funcionando

**Mas primeiro: BUSQUE A ANON KEY! 🔑**







