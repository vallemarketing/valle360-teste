# Sistema de Gestão de Posts - Valle AI

## Visão Geral

Sistema completo e inteligente para gerenciamento de agendamentos, visualização de calendário, monitoramento de publicações e relatórios de redes sociais para clientes da agência. Inclui funcionalidades de IA preditiva, automações inteligentes e analytics avançados.

---

## 1. Módulo: Calendário de Posts

### 1.1 Visualizações

- **Mensal**: Visão geral com cards compactos mostrando quantidade de posts por dia
- **Semanal**: Detalhamento com preview dos criativos e horários
- **Diária**: Timeline completa com todas as informações do post
- **Lista/Tabela**: Visualização em formato de tabela com filtros avançados

### 1.2 Elementos do Card de Post

```
┌─────────────────────────────────────┐
│ [Logo Cliente] Nome do Cliente      │
│ ─────────────────────────────────── │
│ [🟢 Instagram] [🔵 Facebook]        │
│                                     │
│ ┌─────────────┐                     │
│ │  Preview    │  Texto do post...   │
│ │  da Imagem  │  (truncado)         │
│ └─────────────┘                     │
│                                     │
│ 📅 15/01/2026  ⏰ 14:30             │
│ Status: ✅ Publicado                │
│ 🎯 Score IA: 85/100                 │
│                                     │
│ [Editar] [Clonar] [Excluir]        │
└─────────────────────────────────────┘
```

### 1.3 Status dos Posts

| Status | Ícone | Cor | Descrição |
|--------|-------|-----|-----------|
| Rascunho | 📝 | Cinza | Salvo mas não agendado |
| Agendado | ⏳ | Amarelo | Aguardando horário de publicação |
| Em Aprovação | 👁️ | Roxo | Aguardando aprovação do cliente |
| Publicado | ✅ | Verde | Publicado com sucesso |
| Erro | ❌ | Vermelho | Falha na publicação |
| Parcial | ⚠️ | Laranja | Publicado em algumas redes |

### 1.4 Filtros Disponíveis

- **Por Cliente**: Dropdown com todos os clientes ativos
- **Por Rede Social**: Instagram, Facebook, LinkedIn, TikTok, X/Twitter
- **Por Status**: Todos os status listados acima
- **Por Período**: Date picker com range de datas
- **Por Responsável**: Usuário que criou/editou o post
- **Por Tags/Categorias**: Campanha, Orgânico, Stories, Reels, etc.
- **Por Score IA**: Filtrar posts com score acima/abaixo de X

### 1.5 Ações Rápidas

- **Drag & Drop**: Arrastar post para outro dia/horário
- **Clonar Post**: Duplicar para outro cliente ou rede
- **Edição Rápida**: Modal para editar sem sair do calendário
- **Bulk Actions**: Selecionar múltiplos posts para ações em lote

### 1.6 Calendário Inteligente com IA

#### Sugestão de Datas Comemorativas Relevantes
- Não mostra todas as datas, apenas as relevantes para cada cliente
- Baseado no segmento do cliente (clínica → Dia do Médico, restaurante → Dia da Pizza)
- Sugestão aparece como card no calendário com opção de "Criar Post"

#### Alerta de "Buraco" no Calendário
- Detecta automaticamente gaps de conteúdo
- Exibe alerta: "Cliente X tem 0 posts agendados para os próximos 5 dias"
- Botão: "Criar conteúdo" ou "Sugerir ideias com IA"

#### Sugestão de Frequência Ideal
- Baseado em benchmarks do segmento + histórico do cliente
- Exibe recomendação: "Para este cliente, recomendamos 5 posts/semana no Instagram"
- Indicador visual se está abaixo/acima da frequência ideal

---

## 2. Módulo: Banco de Ideias

### 2.1 Funcionalidades

- Salvar ideias sem data definida (backlog de conteúdo)
- Categorizar por cliente e tipo de conteúdo
- Anexar referências (links, imagens, vídeos)
- Converter ideia em post agendado com um clique
- Notas e comentários da equipe
- IA sugere ideias baseadas em gaps de conteúdo

### 2.2 Campos da Ideia

```json
{
  "id": "uuid",
  "cliente_id": "uuid",
  "titulo": "string",
  "descricao": "text",
  "referencias": ["urls"],
  "anexos": ["files"],
  "tags": ["array"],
  "prioridade": "alta|media|baixa",
  "sugerido_por_ia": "boolean",
  "motivo_sugestao": "string",
  "criado_por": "user_id",
  "criado_em": "timestamp",
  "notas": ["array de comentários"]
}
```

### 2.3 Sugestão de Conteúdo com IA (Gaps)

- IA analisa histórico e identifica temas não abordados recentemente
- Exibe sugestões: "Cliente X não posta sobre [tema] há 30 dias, mas é um tema que performa bem"
- Botão para criar ideia/post a partir da sugestão

---

## 3. Módulo: Editor de Posts

### 3.1 Funcionalidades do Editor

- **Preview em tempo real** por rede social (cada rede tem seu preview)
- **Contador de caracteres** com limite por rede
- **Upload de mídia** com validação de dimensões e formatos
- **Biblioteca de mídia** do cliente (reutilizar criativos)
- **Menções** com autocomplete
- **Geolocalização** para posts com local
- **Alt text** para acessibilidade
- **Score de previsão de engajamento** (IA)

### 3.2 Funcionalidades de IA no Editor (Acionadas por Clique)

#### 🤖 Botão: "Gerar Legenda com IA"
- Analisa a imagem/vídeo anexado
- Considera o tom de voz do cliente (configurado no cadastro)
- Gera 3 opções de legenda para o usuário escolher/editar
- Opções: Tom profissional, casual, criativo

#### 🤖 Botão: "Sugerir Hashtags com IA"
- Analisa o conteúdo + histórico do que performou bem
- Consulta trends atuais
- Exibe hashtags organizadas por:
  - Alcance potencial (alto/médio/baixo)
  - Competição (alta/média/baixa)
  - Relevância para o cliente
- Usuário seleciona quais quer usar

#### 🤖 Botão: "Adaptar para Outras Redes"
- Post criado pro Instagram → IA adapta automaticamente:
  - LinkedIn: tom mais profissional
  - Twitter/X: versão curta (280 chars)
  - Facebook: versão adaptada
- Usuário revisa cada adaptação antes de confirmar

#### 🤖 Botão: "Melhorar Texto"
- Reescreve o texto com melhorias de copywriting
- Opções: mais persuasivo, mais curto, mais emocional, mais informativo

### 3.3 Previsão de Engajamento (Score IA)

Exibido em tempo real enquanto edita o post:

```
┌─────────────────────────────────────┐
│ 🎯 PREVISÃO DE ENGAJAMENTO          │
│                                     │
│ Score: 78/100  ████████░░ BOM       │
│                                     │
│ 💡 Sugestões para melhorar:         │
│ • Horário: 14:30 → 18:00 (+12%)     │
│ • Adicionar CTA no final (+8%)      │
│ • Usar carrossel em vez de imagem   │
│   única (+15%)                      │
│                                     │
│ [Aplicar Sugestões] [Ignorar]       │
└─────────────────────────────────────┘
```

### 3.4 Melhor Horário Automático

- Opção: "Agendar no melhor horário" (checkbox)
- Sistema escolhe automaticamente o horário com maior probabilidade de engajamento
- Baseado no histórico específico daquele cliente
- Considera: dia da semana, horário, tipo de conteúdo, rede social

### 3.5 Detecção de Duplicatas/Similaridade

Antes de salvar, verifica automaticamente:
- Conteúdo muito similar já postado recentemente
- Alerta: "Atenção: post similar publicado há 15 dias"
- Mostra o post anterior para comparação
- Opções: "Continuar mesmo assim" ou "Editar"

### 3.6 Campos do Post

```json
{
  "id": "uuid",
  "cliente_id": "uuid",
  "redes_sociais": ["instagram", "facebook"],
  "tipo_conteudo": "feed|stories|reels|carousel",
  "texto": {
    "principal": "texto do post",
    "instagram": "texto customizado para insta",
    "facebook": "texto customizado para fb",
    "linkedin": "texto customizado para linkedin",
    "twitter": "texto customizado para twitter"
  },
  "midias": [
    {
      "url": "string",
      "tipo": "imagem|video",
      "alt_text": "string",
      "ordem": 1
    }
  ],
  "hashtags": ["array"],
  "mencoes": ["array"],
  "link": "url",
  "localizacao": {
    "nome": "string",
    "lat": "float",
    "lng": "float"
  },
  "agendamento": {
    "data": "date",
    "horario": "time",
    "horario_automatico": "boolean",
    "timezone": "America/Sao_Paulo"
  },
  "ia_metadata": {
    "score_previsao": 78,
    "sugestoes_aplicadas": ["array"],
    "legenda_gerada_ia": "boolean",
    "hashtags_sugeridas_ia": ["array"]
  },
  "status": "rascunho|agendado|publicado|erro",
  "meta": {
    "post_id_instagram": "string",
    "post_id_facebook": "string",
    "publicado_em": "timestamp"
  },
  "criado_por": "user_id",
  "criado_em": "timestamp",
  "atualizado_em": "timestamp"
}
```

---

## 4. Módulo: Monitoramento de Publicações

### 4.1 Dashboard de Status

```
┌─────────────────────────────────────────────────────────┐
│                    HOJE - 15/01/2026                    │
├─────────────┬─────────────┬─────────────┬──────────────┤
│   ✅ 12     │   ⏳ 5      │   ❌ 1      │   📝 3       │
│ Publicados  │  Agendados  │   Erros     │  Rascunhos   │
└─────────────┴─────────────┴─────────────┴──────────────┘

┌─────────────────────────────────────────────────────────┐
│ ⚠️ ALERTAS PROATIVOS                                    │
├─────────────────────────────────────────────────────────┤
│ 🔑 Token do Cliente X expira em 7 dias                  │
│ 📅 Cliente Y não tem posts para próxima semana          │
│ 📉 Cliente Z está 40% abaixo da média de engajamento    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Log de Publicações

| Horário | Cliente | Rede | Status | Detalhes |
|---------|---------|------|--------|----------|
| 14:30 | Cliente A | Instagram | ✅ Publicado | Post ID: 123456 |
| 14:00 | Cliente B | Facebook | ❌ Erro | Token expirado |
| 13:30 | Cliente C | LinkedIn | ✅ Publicado | Post ID: 789012 |

### 4.3 Alertas Proativos com IA

Sistema monitora e alerta automaticamente:

| Tipo de Alerta | Descrição | Antecedência |
|----------------|-----------|--------------|
| Token Expirando | "Token do Cliente X expira em 7 dias" | 7 dias |
| Calendário Vazio | "Cliente Y não tem posts para próxima semana" | Quando detectar |
| Engajamento Baixo | "Cliente Z está 40% abaixo da média" | Análise semanal |
| Erro Recorrente | "Falha 3x seguidas no Cliente W" | Imediato |
| Crescimento Anormal | "Cliente V teve queda de 500 seguidores" | Imediato |

### 4.4 Retry Inteligente com Fallback

Lógica de retry automático quando falha publicação:

```
1ª tentativa falhou
    ↓ aguarda 5 minutos
2ª tentativa falhou
    ↓ aguarda 15 minutos
3ª tentativa falhou
    ↓ aguarda 1 hora
4ª tentativa falhou
    ↓ NOTIFICA responsável + oferece opções:
      • Tentar novamente manualmente
      • Publicar só nas redes que funcionaram
      • Reagendar para outro horário
      • Cancelar publicação
```

### 4.5 Reagendamento Automático por Performance

- Se o post anterior ainda está "bombando" (engajamento acima da média nas últimas 2h)
- Sistema adia automaticamente o próximo post para não competir
- Ou se detectar baixa atividade no horário, antecipa
- Configurável por cliente (on/off)

### 4.6 Notificações

- **Webhook para n8n**: Dispara em caso de erro ou alerta
- **Notificação WhatsApp**: Para o responsável pelo cliente
- **Email**: Resumo diário de publicações
- **Alerta no Dashboard**: Badge vermelho com contador

### 4.7 Detalhes de Erro

```json
{
  "post_id": "uuid",
  "tentativas": 3,
  "ultimo_erro": {
    "codigo": "190",
    "mensagem": "Access token has expired",
    "api_response": "...",
    "timestamp": "2026-01-15T14:00:00Z"
  },
  "acoes_disponiveis": [
    "Reconectar conta",
    "Tentar novamente",
    "Reagendar",
    "Cancelar publicação"
  ],
  "fallback_disponivel": {
    "redes_funcionando": ["facebook", "linkedin"],
    "publicar_parcial": true
  }
}
```

---

## 5. Módulo: Relatórios e Analytics

### 5.1 Métricas por Post

- Alcance (reach)
- Impressões
- Engajamento (likes, comentários, compartilhamentos, salvos)
- Taxa de engajamento (%)
- Cliques no link (se houver)
- Visualizações de vídeo (se aplicável)
- Comparativo com previsão da IA (previsto vs realizado)

### 5.2 Dashboard do Cliente

```
┌─────────────────────────────────────────────────────────┐
│  CLIENTE: Empresa XYZ           Período: Jan/2026      │
│  🏥 Score de Saúde: 85/100  ████████░░                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 RESUMO GERAL                                        │
│  ├─ Total de Posts: 45                                  │
│  ├─ Alcance Total: 125.430                              │
│  ├─ Engajamento Total: 8.234                            │
│  └─ Taxa Média de Engajamento: 6,5%                     │
│                                                         │
│  📈 POR REDE SOCIAL                                     │
│  ┌──────────────┬─────────┬─────────┬────────┐         │
│  │ Rede         │ Posts   │ Alcance │ Eng.   │         │
│  ├──────────────┼─────────┼─────────┼────────┤         │
│  │ Instagram    │ 25      │ 85.000  │ 5.200  │         │
│  │ Facebook     │ 15      │ 32.000  │ 2.100  │         │
│  │ LinkedIn     │ 5       │ 8.430   │ 934    │         │
│  └──────────────┴─────────┴─────────┴────────┘         │
│                                                         │
│  🏆 TOP 5 POSTS (por engajamento)                       │
│  1. [Preview] "Texto do post..." - 1.234 interações    │
│  2. [Preview] "Texto do post..." - 987 interações      │
│  3. [Preview] "Texto do post..." - 756 interações      │
│                                                         │
│  📉 PIORES POSTS (para aprendizado)                     │
│  1. [Preview] "Texto do post..." - 12 interações       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Score de Saúde do Perfil

Nota consolidada de 0-100 considerando:

| Fator | Peso | Descrição |
|-------|------|-----------|
| Frequência de posts | 20% | Está postando na frequência ideal? |
| Taxa de engajamento | 25% | Comparado com histórico e benchmark |
| Crescimento de seguidores | 15% | Evolução mês a mês |
| Resposta a comentários | 10% | Tempo médio de resposta |
| Qualidade do conteúdo | 15% | Baseado em métricas |
| Consistência | 15% | Regularidade de postagens |

Dashboard mostra evolução do score mês a mês com gráfico.

### 5.4 Benchmark do Segmento

Compara métricas do cliente com média de empresas do mesmo segmento:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 BENCHMARK: Clínicas Odontológicas                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Taxa de Engajamento                                     │
│ Seu cliente: 6,5%  ████████████████░░░░  Média: 5,2%   │
│ ✅ 25% ACIMA da média do segmento                       │
│                                                         │
│ Frequência de Posts                                     │
│ Seu cliente: 12/mês  ██████████░░░░░░░░  Média: 15/mês │
│ ⚠️ 20% ABAIXO da média do segmento                      │
│                                                         │
│ Crescimento de Seguidores                               │
│ Seu cliente: +3,2%  ████████████████░░░░  Média: +2,8% │
│ ✅ 14% ACIMA da média do segmento                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.5 Melhores Horários (Análise IA)

Análise automática dos melhores horários para postar:

```
┌─────────────────────────────────────────────────────────┐
│ 🕐 MELHORES HORÁRIOS - Cliente XYZ                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ INSTAGRAM                                               │
│ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐           │
│ │ Seg │ Ter │ Qua │ Qui │ Sex │ Sáb │ Dom │           │
│ ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│ │18:00│12:00│18:00│19:00│20:00│10:00│11:00│           │
│ │ 🔥  │ 🔥  │ 🔥  │ 🔥  │ 🔥  │ ⭐  │ ⭐  │           │
│ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘           │
│                                                         │
│ 🔥 = Alto engajamento  ⭐ = Engajamento moderado       │
│                                                         │
│ RECOMENDAÇÃO IA:                                        │
│ "Posts às terças e quintas às 18h têm 45% mais         │
│  engajamento para este cliente."                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.6 Relatório Automático com Insights em Texto (IA)

Não só gráficos, mas a IA escreve análise em linguagem natural:

```
┌─────────────────────────────────────────────────────────┐
│ 📝 ANÁLISE AUTOMÁTICA - Janeiro 2026                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ "Este mês o Instagram do cliente XYZ cresceu 15% em    │
│ alcance comparado a dezembro. Os posts de Reels        │
│ performaram 3x melhor que imagens estáticas.           │
│                                                         │
│ O engajamento foi maior às terças e quintas-feiras,    │
│ especialmente no horário das 18h às 20h.               │
│                                                         │
│ PONTOS POSITIVOS:                                       │
│ • Crescimento consistente de seguidores (+320)         │
│ • Taxa de engajamento acima da média do setor          │
│ • Conteúdo de antes/depois teve alto compartilhamento  │
│                                                         │
│ OPORTUNIDADES DE MELHORIA:                              │
│ • Aumentar frequência de Reels (de 2 para 4/semana)    │
│ • Testar posts aos domingos (gap identificado)         │
│ • Responder comentários mais rapidamente (atual: 4h)   │
│                                                         │
│ PREVISÃO PARA PRÓXIMO MÊS:                              │
│ Se mantiver a estratégia atual, estimamos crescimento  │
│ de 8-12% no alcance e +250 novos seguidores."          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.7 Previsão de Crescimento

Baseado no histórico, projeta crescimento futuro:

```
📈 PROJEÇÃO DE CRESCIMENTO

Seguidores Atuais: 8.500

Se mantiver frequência atual:
• Em 1 mês: ~8.820 seguidores
• Em 3 meses: ~9.500 seguidores
• Em 6 meses: ~11.200 seguidores
• Meta 10k: ~4 meses

Se aumentar frequência em 50%:
• Em 3 meses: ~10.800 seguidores
• Meta 10k: ~2 meses
```

### 5.8 Exportação de Relatórios

- **PDF**: Com marca branca (logo do cliente ou da agência)
- **Excel**: Dados brutos para análise
- **Link público**: URL temporária para cliente visualizar online
- **Envio automático**: Configurar envio semanal/mensal por email
- **Personalização**: Escolher quais seções incluir no relatório

---

## 6. Módulo: Detector de Conteúdo Evergreen

### 6.1 Funcionalidade

IA identifica posts antigos que ainda são relevantes e sugere repost:

```
┌─────────────────────────────────────────────────────────┐
│ 🔄 SUGESTÕES DE REPOST - Conteúdo Evergreen             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────┐                                         │
│ │  [Preview]  │  "Dicas para manter a saúde bucal..."  │
│ │   Imagem    │                                         │
│ └─────────────┘                                         │
│                                                         │
│ 📅 Publicado há 6 meses                                 │
│ 📊 Engajamento original: 1.234 interações (alto)        │
│ ✅ Conteúdo ainda relevante                             │
│                                                         │
│ 💡 Por que sugerimos:                                   │
│ "Este post teve alto engajamento e o tema é atemporal. │
│  Novos seguidores ainda não viram este conteúdo."       │
│                                                         │
│ [Repostar Agora] [Agendar Repost] [Ignorar] [Não       │
│                                    sugerir novamente]   │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Critérios para Sugestão

- Post com engajamento acima da média
- Conteúdo não datado (sem referência a datas específicas)
- Não repostado nos últimos 3 meses
- Tema ainda relevante para o cliente

---

## 7. Módulo: Análise de Comentários com IA

### 7.1 Análise de Sentimento

Monitora comentários e classifica automaticamente:

```
┌─────────────────────────────────────────────────────────┐
│ 💬 ANÁLISE DE COMENTÁRIOS - Últimos 7 dias              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Total de comentários: 156                               │
│                                                         │
│ 😊 Positivos: 120 (77%)  ████████████████░░░░          │
│ 😐 Neutros: 28 (18%)     ████░░░░░░░░░░░░░░░░          │
│ 😠 Negativos: 8 (5%)     █░░░░░░░░░░░░░░░░░░░          │
│                                                         │
│ ⚠️ ALERTA: Pico de comentários negativos detectado     │
│    no post de 14/01 sobre preços.                       │
│    [Ver detalhes]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Sugestão de Respostas com IA

Para comentários comuns (perguntas sobre preço, horário, etc.):

```
┌─────────────────────────────────────────────────────────┐
│ 💬 COMENTÁRIO PENDENTE                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ @usuario_123: "Qual o valor da consulta?"               │
│                                                         │
│ 🤖 SUGESTÃO DE RESPOSTA (IA):                           │
│ "Olá! 😊 O valor da consulta varia de acordo com o     │
│  procedimento. Chama no direct que te passamos todas   │
│  as informações! 💬"                                    │
│                                                         │
│ [Aprovar e Enviar] [Editar] [Escrever do zero]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Alertas de Gestão de Crise

- Detecta pico de negatividade em tempo real
- Notifica responsável imediatamente
- Sugere ações: responder, ocultar, ou escalar

---

## 8. Módulo: Gestão de Clientes

### 8.1 Informações do Cliente

```json
{
  "id": "uuid",
  "nome": "Empresa XYZ",
  "slug": "empresa-xyz",
  "logo": "url",
  "cor_primaria": "#hex",
  "segmento": "clinica_odontologica",
  "tom_de_voz": "profissional_amigavel",
  "palavras_chave": ["odontologia", "sorriso", "saúde bucal"],
  "contas_conectadas": [
    {
      "rede": "instagram",
      "username": "@empresaxyz",
      "account_id": "string",
      "access_token": "encrypted",
      "status": "ativo|expirado|erro",
      "conectado_em": "timestamp",
      "expira_em": "timestamp"
    }
  ],
  "responsaveis": ["user_ids"],
  "configuracoes": {
    "aprovacao_obrigatoria": true,
    "url_sistema_aprovacao": "https://...",
    "notificar_publicacao": true,
    "relatorio_automatico": "semanal",
    "horario_automatico": true,
    "reagendamento_inteligente": true,
    "frequencia_ideal_posts": {
      "instagram": 5,
      "facebook": 3,
      "linkedin": 2
    }
  },
  "score_saude": 85,
  "ultimo_calculo_score": "timestamp"
}
```

### 8.2 Health Check por Cliente

- Status de todas as conexões com APIs
- Alerta de tokens próximos de expirar (7 dias antes)
- Verificação diária automática
- Dashboard consolidado de saúde de todos os clientes

---

## 9. Módulo: Aprovação de Posts

### 9.1 Integração com Sistema Existente

O sistema não cria novo workflow, apenas integra com o existente:

```
┌─────────────────────────────────────────────────────────┐
│ 📋 ENVIAR PARA APROVAÇÃO                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Cliente: Empresa XYZ                                    │
│ Post: "Texto do post..."                                │
│ Agendado para: 15/01/2026 às 14:30                     │
│                                                         │
│ [Enviar para Aprovação] ← Abre sistema de aprovação    │
│                            existente do cliente         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Status de Aprovação

| Status | Descrição |
|--------|-----------|
| Pendente Envio | Ainda não enviado para aprovação |
| Aguardando Cliente | Enviado para aprovação (link do sistema externo) |
| Aprovado | Cliente aprovou no sistema externo |
| Alteração Solicitada | Cliente pediu mudanças |

### 9.3 Sincronização

- Webhook do sistema de aprovação atualiza status no sistema de posts
- Ou: verificação periódica do status no sistema externo

---

## 10. Integrações

### 10.1 APIs de Redes Sociais

| Rede | Funcionalidades |
|------|-----------------|
| Instagram (Graph API) | Feed, Stories, Reels, Carrossel, Métricas, Comentários |
| Facebook (Graph API) | Feed, Stories, Métricas, Comentários |
| LinkedIn | Feed, Métricas |
| TikTok | Vídeos, Métricas |
| X/Twitter | Tweets, Métricas |
| YouTube | Vídeos (upload via API) |

### 10.2 Integrações Internas

- **n8n**: Webhooks para automações e alertas
- **Supabase**: Banco de dados e autenticação
- **WhatsApp API**: Notificações para equipe e clientes
- **OpenAI/Claude API**: Funcionalidades de IA (legendas, análise, sugestões)
- **Sistema de Aprovação Existente**: Via webhook/API

### 10.3 Webhooks Disponíveis

| Evento | Payload |
|--------|---------|
| post.publicado | {post_id, cliente_id, rede, post_id_rede, timestamp} |
| post.erro | {post_id, cliente_id, rede, erro, tentativas} |
| post.agendado | {post_id, cliente_id, agendado_para} |
| alerta.token_expirando | {cliente_id, rede, expira_em} |
| alerta.engajamento_baixo | {cliente_id, percentual_abaixo} |
| comentario.negativo | {post_id, comentario, sentimento_score} |

---

## 11. Estrutura de Banco de Dados (Supabase)

### 11.1 Tabelas Principais

```sql
-- Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#000000',
  segmento TEXT,
  tom_de_voz TEXT DEFAULT 'profissional',
  palavras_chave TEXT[] DEFAULT '{}',
  url_sistema_aprovacao TEXT,
  configuracoes JSONB DEFAULT '{}',
  score_saude INT DEFAULT 0,
  ultimo_calculo_score TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Contas de Redes Sociais
CREATE TABLE contas_redes_sociais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  rede TEXT NOT NULL,
  username TEXT,
  account_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expira_em TIMESTAMPTZ,
  status TEXT DEFAULT 'ativo',
  meta JSONB DEFAULT '{}',
  conectado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  texto JSONB NOT NULL,
  midias JSONB DEFAULT '[]',
  hashtags TEXT[] DEFAULT '{}',
  mencoes TEXT[] DEFAULT '{}',
  link TEXT,
  localizacao JSONB,
  redes_destino TEXT[] NOT NULL,
  agendado_para TIMESTAMPTZ,
  horario_automatico BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'rascunho',
  status_aprovacao TEXT DEFAULT 'pendente',
  publicacoes JSONB DEFAULT '{}',
  ia_metadata JSONB DEFAULT '{}',
  score_previsao INT,
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Log de Publicações
CREATE TABLE log_publicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  rede TEXT NOT NULL,
  status TEXT NOT NULL,
  post_id_rede TEXT,
  resposta_api JSONB,
  erro_codigo TEXT,
  erro_mensagem TEXT,
  tentativa INT DEFAULT 1,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Métricas de Posts
CREATE TABLE metricas_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  rede TEXT NOT NULL,
  post_id_rede TEXT NOT NULL,
  alcance INT DEFAULT 0,
  impressoes INT DEFAULT 0,
  likes INT DEFAULT 0,
  comentarios INT DEFAULT 0,
  compartilhamentos INT DEFAULT 0,
  salvos INT DEFAULT 0,
  cliques_link INT DEFAULT 0,
  visualizacoes_video INT DEFAULT 0,
  taxa_engajamento DECIMAL(5,2) DEFAULT 0,
  coletado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Ideias/Backlog
CREATE TABLE ideias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  referencias TEXT[] DEFAULT '{}',
  anexos JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  prioridade TEXT DEFAULT 'media',
  sugerido_por_ia BOOLEAN DEFAULT false,
  motivo_sugestao TEXT,
  criado_por UUID,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários (para análise de sentimento)
CREATE TABLE comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  rede TEXT NOT NULL,
  comentario_id_rede TEXT,
  autor TEXT,
  texto TEXT,
  sentimento TEXT,
  sentimento_score DECIMAL(3,2),
  respondido BOOLEAN DEFAULT false,
  resposta_sugerida TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas
CREATE TABLE alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade TEXT DEFAULT 'media',
  lido BOOLEAN DEFAULT false,
  resolvido BOOLEAN DEFAULT false,
  meta JSONB DEFAULT '{}',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Sugestões de Repost (Evergreen)
CREATE TABLE sugestoes_repost (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  motivo TEXT,
  score_relevancia INT,
  ignorado BOOLEAN DEFAULT false,
  repostado BOOLEAN DEFAULT false,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Score de Saúde
CREATE TABLE historico_score_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  score INT NOT NULL,
  detalhes JSONB,
  periodo_inicio DATE,
  periodo_fim DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmarks por Segmento
CREATE TABLE benchmarks_segmento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segmento TEXT NOT NULL,
  rede TEXT NOT NULL,
  metrica TEXT NOT NULL,
  valor_medio DECIMAL(10,2),
  valor_p25 DECIMAL(10,2),
  valor_p75 DECIMAL(10,2),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);
```

### 11.2 Views Úteis

```sql
-- View: Posts do dia com status
CREATE VIEW vw_posts_hoje AS
SELECT 
  p.*,
  c.nome as cliente_nome,
  c.logo_url as cliente_logo,
  c.segmento as cliente_segmento
FROM posts p
JOIN clientes c ON p.cliente_id = c.id
WHERE DATE(p.agendado_para) = CURRENT_DATE
ORDER BY p.agendado_para;

-- View: Resumo de publicações por cliente
CREATE VIEW vw_resumo_cliente AS
SELECT 
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.score_saude,
  COUNT(p.id) as total_posts,
  COUNT(CASE WHEN p.status = 'publicado' THEN 1 END) as publicados,
  COUNT(CASE WHEN p.status = 'agendado' THEN 1 END) as agendados,
  COUNT(CASE WHEN p.status = 'erro' THEN 1 END) as erros
FROM clientes c
LEFT JOIN posts p ON c.id = p.cliente_id
GROUP BY c.id, c.nome, c.score_saude;

-- View: Alertas não resolvidos
CREATE VIEW vw_alertas_pendentes AS
SELECT 
  a.*,
  c.nome as cliente_nome
FROM alertas a
JOIN clientes c ON a.cliente_id = c.id
WHERE a.resolvido = false
ORDER BY 
  CASE a.prioridade 
    WHEN 'alta' THEN 1 
    WHEN 'media' THEN 2 
    ELSE 3 
  END,
  a.criado_em DESC;

-- View: Tokens próximos de expirar
CREATE VIEW vw_tokens_expirando AS
SELECT 
  crs.*,
  c.nome as cliente_nome
FROM contas_redes_sociais crs
JOIN clientes c ON crs.cliente_id = c.id
WHERE crs.token_expira_em <= NOW() + INTERVAL '7 days'
  AND crs.status = 'ativo'
ORDER BY crs.token_expira_em;
```

### 11.3 Functions para IA

```sql
-- Function: Calcular score de saúde do cliente
CREATE OR REPLACE FUNCTION calcular_score_saude(p_cliente_id UUID)
RETURNS INT AS $$
DECLARE
  v_score INT := 0;
  v_frequencia_score INT;
  v_engajamento_score INT;
  v_crescimento_score INT;
  v_consistencia_score INT;
BEGIN
  -- Lógica de cálculo do score
  -- (implementar baseado nos critérios definidos)
  
  -- Atualiza o cliente
  UPDATE clientes 
  SET score_saude = v_score,
      ultimo_calculo_score = NOW()
  WHERE id = p_cliente_id;
  
  -- Salva histórico
  INSERT INTO historico_score_saude (cliente_id, score, periodo_fim)
  VALUES (p_cliente_id, v_score, CURRENT_DATE);
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function: Detectar gaps no calendário
CREATE OR REPLACE FUNCTION detectar_gaps_calendario(p_cliente_id UUID, p_dias INT DEFAULT 7)
RETURNS TABLE (data_sem_post DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT d::DATE as data_sem_post
  FROM generate_series(
    CURRENT_DATE,
    CURRENT_DATE + (p_dias || ' days')::INTERVAL,
    '1 day'::INTERVAL
  ) d
  WHERE NOT EXISTS (
    SELECT 1 FROM posts p
    WHERE p.cliente_id = p_cliente_id
      AND DATE(p.agendado_para) = d::DATE
      AND p.status IN ('agendado', 'publicado')
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 12. Fluxos de Automação (n8n)

### 12.1 Fluxo: Publicação de Posts

```
Trigger: Cron (a cada 1 minuto)
    ↓
Query: Posts agendados para agora
    ↓
Para cada post:
    ↓
Publicar via API da rede
    ↓
Se sucesso → Atualizar status + Coletar métricas iniciais
Se erro → Retry logic + Notificar se falhar 3x
```

### 12.2 Fluxo: Coleta de Métricas

```
Trigger: Cron (a cada 6 horas)
    ↓
Query: Posts publicados nas últimas 48h
    ↓
Para cada post:
    ↓
Buscar métricas via API
    ↓
Salvar em metricas_posts
    ↓
Se engajamento muito baixo → Criar alerta
```

### 12.3 Fluxo: Análise de Comentários

```
Trigger: Cron (a cada 1 hora)
    ↓
Query: Posts publicados nos últimos 7 dias
    ↓
Buscar novos comentários via API
    ↓
Analisar sentimento com IA
    ↓
Se negativo → Criar alerta + Sugerir resposta
```

### 12.4 Fluxo: Alertas Proativos

```
Trigger: Cron (diário às 8h)
    ↓
Verificar tokens expirando
Verificar gaps no calendário
Calcular score de saúde
Verificar engajamento vs média
    ↓
Criar alertas conforme necessário
    ↓
Notificar via WhatsApp/Email
```

### 12.5 Fluxo: Sugestão de Repost (Evergreen)

```
Trigger: Cron (semanal)
    ↓
Query: Posts com alto engajamento > 3 meses
    ↓
Filtrar: Conteúdo atemporal (sem datas)
    ↓
Verificar: Não repostado recentemente
    ↓
Criar sugestão de repost
```

---

## 13. Próximos Passos de Implementação

### Fase 1: MVP Core (3-4 semanas)
- [ ] Tela de calendário (mensal/semanal/diário)
- [ ] Listagem de posts agendados por cliente
- [ ] Status de publicação (sucesso/erro)
- [ ] Filtros por cliente/rede/status
- [ ] Log básico de publicações
- [ ] Integração com sistema de aprovação existente

### Fase 2: Editor Inteligente (3-4 semanas)
- [ ] Editor de posts completo
- [ ] Preview por rede social
- [ ] Clone de posts
- [ ] Drag & drop no calendário
- [ ] Banco de ideias
- [ ] Detecção de duplicatas

### Fase 3: IA - Geração de Conteúdo (2-3 semanas)
- [ ] Botão "Gerar Legenda com IA"
- [ ] Botão "Sugerir Hashtags com IA"
- [ ] Botão "Adaptar para Outras Redes"
- [ ] Botão "Melhorar Texto"

### Fase 4: IA - Previsões (2-3 semanas)
- [ ] Score de previsão de engajamento
- [ ] Sugestão de melhor horário
- [ ] Sugestão de melhorias no post
- [ ] Horário automático

### Fase 5: Monitoramento Inteligente (2-3 semanas)
- [ ] Dashboard de status em tempo real
- [ ] Log de erros detalhado
- [ ] Retry inteligente com fallback
- [ ] Alertas proativos
- [ ] Notificações via WhatsApp/n8n

### Fase 6: Analytics com IA (3-4 semanas)
- [ ] Coleta de métricas via API
- [ ] Score de saúde do perfil
- [ ] Benchmark do segmento
- [ ] Melhores horários (análise)
- [ ] Relatório com insights em texto (IA)
- [ ] Previsão de crescimento
- [ ] Exportação PDF

### Fase 7: Features Avançadas (2-3 semanas)
- [ ] Detector de conteúdo evergreen
- [ ] Análise de sentimento em comentários
- [ ] Sugestão de respostas com IA
- [ ] Reagendamento automático por performance
- [ ] Sugestão de conteúdo (gaps)

---

## 14. Tecnologias Sugeridas

| Componente | Tecnologia |
|------------|------------|
| Frontend | React/Next.js ou Vue.js |
| Backend | Node.js + Express ou Supabase Edge Functions |
| Banco de Dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth |
| Storage (Mídias) | Supabase Storage ou Cloudinary |
| Filas/Jobs | n8n |
| IA - Texto | OpenAI GPT-4 ou Claude API |
| IA - Imagem | OpenAI Vision ou Claude Vision |
| Notificações | WhatsApp API (Evolution) |
| Relatórios PDF | Puppeteer ou React-PDF |

---

## 15. Considerações de Segurança

### 15.1 Tokens de API
- Armazenar tokens encriptados no banco
- Implementar refresh automático antes de expirar
- Não expor tokens em logs ou frontend

### 15.2 Rate Limits
- Implementar filas para respeitar limites das APIs
- Backoff exponencial em caso de rate limit
- Monitorar uso de API por cliente

### 15.3 Dados Sensíveis
- Métricas e dados de clientes são confidenciais
- Implementar Row Level Security no Supabase
- Logs de acesso para auditoria

---

*Documento criado para Valle AI - Sistema Inteligente de Gestão de Posts para Agências*
*Versão 2.0 - Com funcionalidades de IA e Automações*
