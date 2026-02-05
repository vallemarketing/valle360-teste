# 📸 Como Funciona o Sistema de Upload (Imagens, Vídeos e Carrossel)

## 🎯 Visão Geral

O sistema usa **3 camadas principais**:
1. **Frontend (React)** - Interface do usuário
2. **Firebase Storage** - Armazenamento de arquivos (imagens/vídeos)
3. **Backend (Node.js + PostgreSQL)** - Banco de dados com URLs

---

## 🔄 Fluxo Completo do Upload

### **PASSO 1: Usuário Seleciona Arquivo no Frontend**

```
Usuário clica em "Selecionar Imagem/Vídeo"
   ↓
Frontend recebe o arquivo (File object)
   ↓
Validações no cliente:
   - Tipo de arquivo (image/* ou video/*)
   - Tamanho (10MB para imagem, 100MB para vídeo)
   ↓
Cria preview local (blob URL)
   ↓
Arquivo fica em memória esperando upload
```

**Código:** `PostForm.jsx` → `handleFileSelect` ou `handleVideoSelect`

---

### **PASSO 2: Usuário Clica em "Enviar para Firebase"**

```
Usuário clica no botão "Fazer Upload para Firebase"
   ↓
Frontend chama função uploadImageToFirebase() ou uploadVideoToFirebase()
   ↓
Firebase SDK faz upload direto para o Firebase Storage
   ↓
Firebase retorna uma URL pública permanente
   ↓
Frontend salva essa URL no state (formData.urlImagem ou formData.urlVideo)
   ↓
Mostra mensagem de sucesso ✅
```

**Código:** `firebaseStorage.js` → `uploadImageToFirebase` / `uploadVideoToFirebase`

---

### **PASSO 3: Usuário Preenche Outros Campos e Salva**

```
Usuário preenche: data, hora, legenda, colaboradores
   ↓
Usuário clica em "Criar Post"
   ↓
Frontend envia para o Backend apenas a URL do Firebase (não o arquivo!)
   ↓
Backend salva no PostgreSQL:
   - urlimagem: "https://firebasestorage.googleapis.com/..."
   - urlvideo: "https://firebasestorage.googleapis.com/..."
   - carrossel: "url1,url2,url3,url4"
```

**Código:** `PostForm.jsx` → `handleSubmit` → API `/api/posts` (POST ou PUT)

---

## 📁 Estrutura dos Arquivos no Firebase

### **Onde os arquivos são salvos:**

```
Firebase Storage
└── Postagem instagra/
    ├── 1703123456789_abc123_foto1.jpg
    ├── 1703123457890_def456_video1.mp4
    ├── 1703123458901_ghi789_foto2.jpg
    └── ...
```

### **Formato do nome do arquivo:**
```
{timestamp}_{randomString}_{nomeOriginal}

Exemplo:
1703123456789_abc123_minhaFoto.jpg
```

Isso garante que **nunca haverá arquivos duplicados**.

---

## 🗄️ Estrutura no Banco de Dados PostgreSQL

### **Tabela `posts`:**

| Campo          | Tipo   | Exemplo                                           |
|---------------|--------|---------------------------------------------------|
| id            | INT    | 1                                                 |
| data          | STRING | "22/12/2024"                                      |
| hora          | STRING | "14:30"                                           |
| urlimagem     | TEXT   | "https://firebasestorage.googleapis.com/v0/b/..." |
| urlvideo      | TEXT   | "https://firebasestorage.googleapis.com/v0/b/..." |
| legenda       | TEXT   | "Confira nosso novo produto!"                    |
| colaboradores | TEXT   | "@user1, @user2"                                  |
| status        | STRING | "agendado" ou "postado"                           |
| carrossel     | TEXT   | "url1,url2,url3,url4"                             |

**Importante:** O banco **NÃO armazena os arquivos**, apenas as URLs onde eles estão no Firebase!

---

## 🎨 Fluxo para cada Tipo de Mídia

### **1. IMAGEM ÚNICA**

```javascript
// Frontend (PostForm.jsx)
1. Usuário seleciona arquivo → handleFileSelect()
2. Preview criado → setImagePreview(URL.createObjectURL(file))
3. Usuário clica "Enviar para Firebase" → handleUpload()
4. Upload feito → uploadImageToFirebase(file)
5. URL retornada → setFormData({ urlImagem: downloadURL })
6. Usuário clica "Salvar" → onSave(formData)
7. Backend recebe → POST /api/posts
8. Salvo no PostgreSQL com a URL
```

### **2. VÍDEO ÚNICO**

```javascript
// Frontend (PostForm.jsx)
1. Usuário seleciona arquivo → handleVideoSelect()
2. Preview criado → setVideoPreview(URL.createObjectURL(file))
3. Usuário clica "Enviar para Firebase" → handleUpload()
4. Upload feito → uploadVideoToFirebase(file)
5. URL retornada → setFormData({ urlVideo: downloadURL })
6. Usuário clica "Salvar" → onSave(formData)
7. Backend recebe → POST /api/posts
8. Salvo no PostgreSQL com a URL
```

### **3. CARROSSEL (até 4 imagens)**

```javascript
// Frontend (PostForm.jsx)
1. Usuário seleciona múltiplos arquivos → handleCarrosselSelect()
2. Validação: máximo 4 imagens
3. Previews criados → setCarrosselPreviews([...])
4. Arquivos armazenados → setCarrosselImages([file1, file2, ...])
5. Usuário clica "Enviar para Firebase" → handleUpload()
6. Upload paralelo → Promise.all([upload1, upload2, ...])
7. URLs retornadas → ["url1", "url2", "url3", "url4"]
8. URLs combinadas → "url1,url2,url3,url4"
9. Salvo em → setFormData({ carrossel: "url1,url2,url3,url4" })
10. Backend salva como string separada por vírgulas
```

**No frontend, para exibir o carrossel:**
```javascript
const urls = post.carrossel.split(','); // ["url1", "url2", "url3", "url4"]
urls.map(url => <img src={url} />)
```

---

## 🔑 Configuração Necessária

### **1. Firebase (Storage)**

Arquivo: `frontend/.env`
```env
VITE_FIREBASE_API_KEY=AIzaSyAKJ06twxEeHXu_I_XIAkjzcoSsS5Zo58k
VITE_FIREBASE_AUTH_DOMAIN=valleai-770e8.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=valleai-770e8
VITE_FIREBASE_STORAGE_BUCKET=valleai-770e8.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=663063953463
VITE_FIREBASE_APP_ID=1:663063953463:web:e3054c24966e4791b63fb2
```

### **2. Regras do Firebase Storage**

No console do Firebase:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Qualquer um pode ler (URLs públicas)
      allow write: if true; // Qualquer um pode escrever (remova isso em produção!)
    }
  }
}
```

**⚠️ IMPORTANTE:** Em produção, adicione autenticação nas regras!

### **3. PostgreSQL (Backend)**

Arquivo: `backend/.env` (Railway)
```env
DATABASE_URL=postgresql://postgres:senha@postgres.railway.internal:5432/railway
JWT_SECRET=seu_secret_super_seguro
PORT=3000
```

---

## 📊 Arquitetura Visual

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  (React + Vite)                                             │
│                                                              │
│  1. Usuário seleciona arquivo                               │
│  2. Preview local (blob)                                    │
│  3. Clica "Enviar para Firebase"                            │
│     ↓                                                        │
│  ┌────────────────────────────────────┐                     │
│  │   Firebase SDK (firebaseStorage.js)│                     │
│  │   - uploadImageToFirebase()        │                     │
│  │   - uploadVideoToFirebase()        │                     │
│  └────────────────────────────────────┘                     │
│     ↓                                                        │
└─────┼────────────────────────────────────────────────────────┘
      │
      │ Upload direto do arquivo
      ↓
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE STORAGE                          │
│  (Google Cloud)                                              │
│                                                              │
│  Pasta: "Postagem instagra"                                 │
│    - 1703123456789_abc123_foto.jpg                          │
│    - 1703123457890_def456_video.mp4                         │
│                                                              │
│  Retorna: URL pública permanente ✅                         │
│  "https://firebasestorage.googleapis.com/v0/b/..."          │
└─────┬───────────────────────────────────────────────────────┘
      │
      │ URL retornada para o frontend
      ↓
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  4. Recebe URL do Firebase                                  │
│  5. Salva URL no state (formData)                           │
│  6. Usuário preenche outros campos                          │
│  7. Clica "Salvar"                                          │
│     ↓                                                        │
│  API Request (POST /api/posts)                              │
│  Body: {                                                    │
│    data: "22/12/2024",                                      │
│    hora: "14:30",                                           │
│    urlImagem: "https://firebasestorage...",                │
│    legenda: "Texto..."                                      │
│  }                                                          │
└─────┼───────────────────────────────────────────────────────┘
      │
      │ HTTP POST (apenas metadados + URL)
      ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                         │
│  (Express + Sequelize)                                       │
│                                                              │
│  routes/posts.js → POST /api/posts                          │
│     ↓                                                        │
│  models/Post.js → Sequelize Model                           │
│     ↓                                                        │
│  INSERT INTO posts (urlimagem, data, hora, legenda...)      │
└─────┼───────────────────────────────────────────────────────┘
      │
      │ SQL INSERT
      ↓
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL (Railway)                       │
│                                                              │
│  Tabela: posts                                              │
│  ┌────┬────────────┬────────┬──────────────────────┐       │
│  │ id │ data       │ hora   │ urlimagem            │       │
│  ├────┼────────────┼────────┼──────────────────────┤       │
│  │ 1  │ 22/12/2024 │ 14:30  │ https://firebase...  │       │
│  └────┴────────────┴────────┴──────────────────────┘       │
│                                                              │
│  ⚠️ NÃO armazena os arquivos, apenas URLs!                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Por que usar Firebase Storage?

### **Vantagens:**
1. ✅ **Gratuito** até 5GB e 1GB/dia de transferência
2. ✅ **CDN global** - arquivos servidos rápido no mundo todo
3. ✅ **URLs permanentes** - nunca mudam
4. ✅ **Não sobrecarrega o backend** - upload direto do navegador
5. ✅ **Escalável** - suporta milhões de arquivos
6. ✅ **Seguro** - regras de acesso configuráveis

### **Alternativas (não recomendadas):**
- ❌ Salvar no banco de dados (BLOB) - muito lento e pesado
- ❌ Salvar no servidor (filesystem) - perde arquivos ao fazer deploy
- ❌ Cloudinary, AWS S3 - mais complexos de configurar

---

## 🔍 Debugging

### **Ver logs no Frontend:**
```javascript
console.log('🔗 API URL configurada:', API_BASE_URL);
console.log('📤 Enviando para Firebase:', file.name);
console.log('✅ URL recebida:', downloadURL);
```

### **Ver logs no Backend:**
```javascript
console.log('📥 POST /api/posts recebido:', req.body);
console.log('💾 Post salvo no banco:', newPost.id);
```

### **Verificar Firebase Storage:**
1. Acesse: https://console.firebase.google.com
2. Vá em "Storage"
3. Veja os arquivos em "Postagem instagra/"

### **Verificar PostgreSQL (Railway):**
1. Acesse Railway Dashboard
2. Clique no PostgreSQL
3. Aba "Data" → veja a tabela `posts`

---

## ❓ Perguntas Frequentes

### **Q: O arquivo é enviado para o backend?**
**R:** NÃO! O arquivo vai direto do navegador para o Firebase. O backend só recebe a URL.

### **Q: Onde fica o arquivo fisicamente?**
**R:** Nos servidores do Google (Firebase Storage), não no seu servidor.

### **Q: E se o Firebase cair?**
**R:** Raro, mas você pode migrar para outro storage (S3, Cloudinary) mudando apenas o `firebaseStorage.js`.

### **Q: Como limitar quem pode fazer upload?**
**R:** Configure regras no Firebase Storage para exigir autenticação.

### **Q: Posso deletar arquivos do Firebase?**
**R:** Sim, mas precisa implementar a função `deleteObject()` do Firebase SDK.

### **Q: O carrossel salva 4 arquivos separados?**
**R:** Sim, faz 4 uploads e salva as 4 URLs separadas por vírgula: `"url1,url2,url3,url4"`.

---

## 📝 Resumo Rápido

| Camada | O que faz | O que armazena |
|--------|-----------|----------------|
| **Frontend** | Interface + Upload para Firebase | Nada (state temporário) |
| **Firebase** | Armazena os arquivos (imagens/vídeos) | Arquivos binários |
| **Backend** | API + Lógica de negócio | Apenas metadados + URLs |
| **PostgreSQL** | Banco de dados relacional | URLs + data + hora + legenda |

**Fluxo simplificado:**
```
Usuário → Seleciona arquivo → Upload Firebase → Recebe URL → 
Preenche form → Salva → Backend recebe URL → Salva no PostgreSQL
```

---

## 🎯 Checklist de Configuração

- [ ] Firebase criado e configurado
- [ ] Regras do Storage configuradas
- [ ] `.env` do frontend com credenciais do Firebase
- [ ] PostgreSQL criado no Railway
- [ ] Tabela `posts` criada no PostgreSQL
- [ ] Backend rodando e conectado ao PostgreSQL
- [ ] Frontend rodando e conectado ao backend

**Tudo pronto? Bora testar! 🚀**

