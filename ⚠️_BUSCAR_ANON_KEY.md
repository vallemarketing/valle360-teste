# ⚠️ ATENÇÃO: Precisa buscar a ANON KEY

## 🔑 O QUE ACONTECEU

✅ Arquivo `.env.local` foi criado com sucesso!  
✅ OpenAI Key configurada  
✅ Supabase URL configurada  
✅ Service Role Key configurada  

❌ **FALTA: ANON PUBLIC KEY**

---

## 🎯 PROBLEMA

A key que você me passou é a **SERVICE_ROLE_KEY** (admin):
```
<EXEMPLO_SERVICE_ROLE_KEY>
```

Para o frontend (parte pública do sistema), precisamos da **ANON PUBLIC KEY**.

---

## 📝 COMO BUSCAR A ANON KEY

### **Passo 1: Acesse o Supabase**

🔗 **Link direto:**  
https://supabase.com/dashboard/project/enzazswaehuawcugexbr/settings/api

### **Passo 2: Localize a ANON KEY**

Na página, você verá duas keys:

```
┌─────────────────────────────────────┐
│ Project API keys                     │
├─────────────────────────────────────┤
│                                      │
│ 🔓 anon public                       │
│ eyJhbGciOiJIUzI1NiIsI...role:anon   │  ← ESSA AQUI!
│ [Copy]                               │
│                                      │
│ 🔐 service_role                      │
│ eyJhbGciOiJIUzI1NiIsI...service_role│  ← Já tenho essa
│ [Copy]                               │
│                                      │
└─────────────────────────────────────┘
```

**Copie a que está marcada como "anon public"**

### **Passo 3: Cole no .env.local**

```bash
# Edite o arquivo
nano .env.local

# Ou
code .env.local
```

**Substitua esta linha:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=PRECISA_BUSCAR_ANON_KEY
```

**Por:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...SUA_ANON_KEY_AQUI...
```

### **Passo 4: Salve e feche**

Se estiver no nano:
- `Ctrl + O` (salvar)
- `Enter`
- `Ctrl + X` (sair)

---

## ⚡ DEPOIS DE CONFIGURAR

Execute os comandos Docker:

```bash
# Build
docker-compose build

# Start
docker-compose up -d

# Ver logs
docker-compose logs -f valle360-app
```

---

## 🤔 POR QUE PRECISO DE DUAS KEYS?

**ANON KEY (pública):**
- ✅ Usada no frontend (navegador)
- ✅ Acesso limitado (Row Level Security)
- ✅ Segura para expor publicamente
- ✅ Permite login, queries básicas

**SERVICE_ROLE KEY (privada):**
- ⚠️ Usada apenas no backend (servidor)
- ⚠️ Acesso total ao banco (bypass RLS)
- ⚠️ NUNCA expor no frontend
- ⚠️ Apenas para operações admin

---

## 📋 STATUS ATUAL

```
✅ Supabase URL: configurada
✅ Service Role Key: configurada
✅ OpenAI Key: configurada
✅ Redis: configurado
❌ Anon Key: FALTANDO (busque no link acima)
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Buscar ANON KEY** (link acima)
2. **Editar .env.local** (substituir `PRECISA_BUSCAR_ANON_KEY`)
3. **Build Docker** (`docker-compose build`)
4. **Start sistema** (`docker-compose up -d`)
5. **Acessar** (http://localhost:3000)

---

## ❓ TEM A ANON KEY?

**Me mande a key e eu atualizo o arquivo automaticamente!**

Ela será algo como:
```
<EXEMPLO_ANON_KEY>
```

Note: tem `"role":"anon"` ao invés de `"role":"service_role"`







