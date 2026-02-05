# 🧪 GUIA DE TESTE RÁPIDO - Valle 360

## 🚀 COMEÇAR

```bash
cd /Users/imac/Desktop/N8N/valle-360
npm run dev
```

Acesse: **http://localhost:3000**

---

## 👤 TESTE COMO COLABORADOR

### 1. Login
- URL: `http://localhost:3000/login`
- Use credenciais de colaborador existente
- Teste área específica (ex: Designer, Social Media, RH)

### 2. Dashboard (✅ 10 features)
**URL:** `/colaborador/dashboard`

**Testes:**
1. ✅ **Icebreaker da Val**
   - Pergunta personalizada aparece?
   - Consegue responder?
   - Contador de streak funcionando?

2. ✅ **Widget de Gamificação**
   - Nível e pontos aparecem?
   - Barra de progresso visível?
   - Badges renderizadas?
   - Scores por categoria mostrados?

3. ✅ **Animações GSAP**
   - Header faz fade-in?
   - Elementos aparecem em sequência?
   - Scroll smooth?

4. ✅ **Botão "Personalizar Dashboard"**
   - Click no botão
   - Widgets aparecem em grid?
   - Drag-and-drop funciona?
   - Botão "Adicionar Widget" abre modal?
   - Consegue remover widgets?
   - Layout salva no localStorage?

5. ✅ **Dashboard Específico da Área**
   - Cards de métricas aparecem?
   - Click em card abre modal com detalhes?
   - Gráficos renderizam?
   - Botão "Perguntar à Val" funciona?

### 3. Kanban (✅ 15 features)
**URL:** `/colaborador/kanban`

**Testes:**
1. ✅ **Drag-and-Drop**
   - Arraste um card para outra coluna
   - Card muda de coluna visualmente?
   - Mudança persiste após refresh?

2. ✅ **Nova Tarefa**
   - Click em "+ Nova Tarefa"
   - Preencha TODOS os campos:
     - Título, Descrição, Prioridade
     - Data de entrega
     - Cliente
     - Links de referência
     - Link do Google Drive
     - Anexos
     - Horas estimadas
     - Dependências
   - Salvar cria o card?

3. ✅ **Visualizações**
   - Click no ícone de **Lista**
     - Tabela aparece?
     - Click em linha abre modal?
   - Click no ícone de **Calendário**
     - Calendário renderiza?
     - Tasks aparecem nas datas corretas?
     - Click em evento abre modal?
   - Voltar para **Kanban**

4. ✅ **Modal de Card**
   - Click em um card
   - Todas as informações aparecem?
   - Consegue editar (se não for super admin)?
   - Botão de deletar aparece apenas para super admin?
   - Adicionar comentário funciona?

### 4. Mensagens (✅ 6 features)
**URL:** `/colaborador/mensagens`

**Testes:**
1. ✅ **Nova Conversa**
   - Click em "+ Nova Conversa"
   - Modal abre?
   - Consegue selecionar participantes?
   - Click em "Iniciar Conversa"

2. ✅ **Chat**
   - Escreva uma mensagem
   - Click no ícone de emoji
   - Picker de emoji abre?
   - Adicione um emoji
   - Envie a mensagem

3. ✅ **Filtros**
   - Toggle entre "Todas" e "Não lidas"
   - Filtro funciona?

4. ✅ **Busca**
   - Digite no campo de busca
   - Conversas são filtradas?

### 5. Notificações (✅ 3 features)
**No Header**

**Testes:**
1. ✅ **Sino de Notificações**
   - Ícone aparece no header?
   - Badge com contagem aparece?
   - Click abre dropdown?

2. ✅ **Lista de Notificações**
   - Últimas notificações aparecem?
   - Click em "Marcar como lida" funciona?
   - Click em "Deletar" remove?

### 6. Configurações (✅ 5 features)
**URL:** `/colaborador/configuracoes`

**Testes:**
1. ✅ **Foto de Perfil**
   - Click em "Trocar Foto"
   - Selecione uma imagem
   - Upload funciona?
   - Foto aparece no círculo?

2. ✅ **2FA**
   - Click em "Ativar 2FA"
   - Modal ou alert aparece com código?
   - Toggle mostra "Desativar"?

3. ✅ **Notificações**
   - Toggles funcionam?
   - Mudanças salvam?

4. ✅ **Tema**
   - Seletor de tema funciona?
   - Cores mudam?

### 7. Arquivos (✅ 4 features)
**URL:** `/colaborador/arquivos`

**Testes:**
1. ✅ **Upload**
   - Click em "Upload"
   - Selecione arquivo
   - Upload funciona?
   - Arquivo aparece na lista?

2. ✅ **Visualizações**
   - Toggle Grid/List funciona?

3. ✅ **Busca**
   - Digite no campo de busca
   - Arquivos são filtrados?

### 8. Solicitações (✅ 3 features)
**URL:** `/colaborador/solicitacoes`

**Testes:**
1. ✅ **Home Office**
   - Preencha formulário
   - Envie solicitação
   - Aparece na lista?

2. ✅ **Férias**
   - Preencha formulário
   - Envie solicitação
   - Aparece na lista?

3. ✅ **Status**
   - Status aparece (Pendente/Aprovado/Rejeitado)?

### 9. Suporte (✅ 3 features)
**URL:** `/colaborador/suporte`

**Testes:**
1. ✅ **Novo Ticket**
   - Preencha formulário
   - Crie ticket
   - Aparece na lista?

2. ✅ **FAQ**
   - Perguntas aparecem?
   - Expand/Collapse funciona?

---

## 👨‍💼 TESTE COMO SUPER ADMIN

### 1. Login como Super Admin
- Use credenciais de super admin
- Acesse área admin

### 2. Kanban App (✅ 5 features)
**URL:** `/admin/kanban-app`

**Testes:**
1. ✅ **Visualização Global**
   - Todos os Kanbans aparecem?
   - Cards de área com estatísticas?
   - Total de tarefas correto?

2. ✅ **Busca e Filtros**
   - Busca por área funciona?
   - Filtro por status funciona?

3. ✅ **Drill-down**
   - Click em card de área
   - Detalhes aparecem?

### 3. Badges (✅ 6 features)
**URL:** `/admin/gamificacao/badges`

**Testes:**
1. ✅ **Listar Badges**
   - Todas as badges aparecem?
   - Grid responsivo?

2. ✅ **Criar Badge**
   - Click em "+ Nova Badge"
   - Preencha:
     - Nome
     - Descrição
     - Escolha ícone
     - Escolha cor
     - Defina critério (ex: 100 pontos)
   - Salvar cria badge?

3. ✅ **Editar Badge**
   - Click no ícone de editar
   - Altere informações
   - Salvar atualiza?

4. ✅ **Deletar Badge**
   - Click no ícone de deletar
   - Confirmação aparece?
   - Badge é removida?

5. ✅ **Ativar/Desativar**
   - Toggle funciona?
   - Badge fica inativa visualmente?

### 4. Regras de Pontuação (✅ 5 features)
**URL:** `/admin/gamificacao/regras`

**Testes:**
1. ✅ **Listar Regras**
   - Todas as regras aparecem?
   - 4 categorias visíveis?

2. ✅ **Editar Pontos**
   - Altere valor de pontos de uma regra
   - Click em "Salvar Alterações"
   - Mudança persiste?

3. ✅ **Configurações Globais**
   - Altere:
     - Multiplicador de nível
     - Nível máximo
     - Bônus diário/semanal/mensal
   - Click em "Salvar Configurações"
   - Mudanças salvam?

4. ✅ **Ativar/Desativar Regras**
   - Toggle funciona?
   - Regra fica inativa?

### 5. Deletar Cards no Kanban
**URL:** `/colaborador/kanban`

**Testes:**
1. ✅ **Permissão de Delete**
   - Faça login como super admin
   - Abra um card
   - Botão de deletar (vermelho) aparece?
   - Click deleta o card?

2. ✅ **Teste com Colaborador**
   - Faça login como colaborador
   - Abra um card
   - Botão de deletar NÃO deve aparecer

---

## 🔍 VERIFICAÇÕES TÉCNICAS

### Console do Browser
Abra DevTools (F12) e verifique:

1. ✅ **Sem erros no console**
   - Nenhum erro vermelho
   - Warnings amarelos são OK

2. ✅ **Console.log de debug**
   - Área detectada: `console.log('📍 Área detectada:', userArea)`
   - Permissões: `console.log('🔐 Permissões:', { role, canDelete })`

3. ✅ **Network tab**
   - Requisições API retornam 200
   - Nenhum 404 ou 500

### Performance
1. ✅ **Animações suaves**
   - GSAP não trava
   - Scroll é fluido

2. ✅ **Drag-and-drop responsivo**
   - Sem lag
   - Feedback visual imediato

3. ✅ **Carregamento rápido**
   - Página inicial < 3s
   - Imagens otimizadas

---

## 📱 TESTE EM MOBILE

1. ✅ **Responsividade**
   - Abra DevTools > Toggle device toolbar
   - Teste iPhone, iPad, Android
   - Layout adapta corretamente?

2. ✅ **Touch gestures**
   - Drag-and-drop funciona no touch?
   - Modais abrem corretamente?

3. ✅ **Menu mobile**
   - Header colapsa em hamburger?
   - Navegação funciona?

---

## 🐛 PROBLEMAS CONHECIDOS

### ⚠️ Se algo não funcionar:

1. **Servidor não inicia**
   ```bash
   # Matar processos na porta 3000
   lsof -ti:3000 | xargs kill -9
   
   # Reinstalar dependências
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   
   # Reiniciar
   npm run dev
   ```

2. **Build falha**
   ```bash
   # Limpar cache
   rm -rf .next
   npm run build
   ```

3. **Banco de dados**
   ```bash
   # Rodar migrations
   cd supabase
   supabase db push
   ```

4. **Upload de foto não funciona**
   - Verificar se bucket `profile-photos` existe no Supabase
   - Verificar se é público
   - Verificar políticas RLS

---

## ✅ CHECKLIST FINAL

Antes de marcar como concluído, verifique:

- [ ] ✅ Login funciona
- [ ] ✅ Dashboard carrega
- [ ] ✅ Icebreaker aparece
- [ ] ✅ Gamification aparece
- [ ] ✅ Botão "Personalizar" funciona
- [ ] ✅ Drag widgets funciona
- [ ] ✅ Kanban drag-and-drop funciona
- [ ] ✅ Nova tarefa com TODOS os campos
- [ ] ✅ Calendar view funciona
- [ ] ✅ List view funciona
- [ ] ✅ Permissões de delete (super admin apenas)
- [ ] ✅ Sistema de mensagens funciona
- [ ] ✅ Emojis funcionam
- [ ] ✅ Notificações aparecem
- [ ] ✅ Upload de foto funciona
- [ ] ✅ 2FA funciona
- [ ] ✅ Admin pode criar badges
- [ ] ✅ Admin pode editar regras
- [ ] ✅ Kanban App mostra todos os kanbans
- [ ] ✅ Val responde com insights

---

## 🎉 TUDO PRONTO!

Se todos os testes passaram, o sistema está **100% funcional** e pronto para uso! 🚀

**Documentação completa:** `VERIFICACAO_IMPLEMENTACAO_COMPLETA.md`

---

**Próximos passos sugeridos:**
1. Testar com usuários reais
2. Coletar feedback
3. Iterar e melhorar
4. Deploy em produção

**Tecnologias utilizadas:**
- Next.js 14
- Supabase
- GSAP
- @hello-pangea/dnd
- react-big-calendar
- emoji-mart
- react-grid-layout
- Framer Motion
- Tailwind CSS
- TypeScript

**Desenvolvido com ❤️ pela Valle 360**


