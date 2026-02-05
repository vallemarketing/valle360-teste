# 🚀 PREDICTIVE AGENCY - BLUEPRINT COMPLETO

## Documento de Arquitetura para Implementação via Cursor

**Versão:** 2.0  
**Data:** Janeiro 2025  
**Tipo:** Blueprint Técnico Completo  
**Framework:** CrewAI + FastAPI + Supabase

---

# 📋 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura Geral](#2-arquitetura-geral)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Tech Stack](#4-tech-stack)
5. [Orquestrador Central](#5-orquestrador-central)
6. [Agentes Estratégicos](#6-agentes-estratégicos)
7. [Agentes Criativos](#7-agentes-criativos)
8. [Agentes de Distribuição](#8-agentes-de-distribuição)
9. [Agentes de Qualidade](#9-agentes-de-qualidade)
10. [Definição das Crews](#10-definição-das-crews)
11. [Fluxos de Trabalho](#11-fluxos-de-trabalho)
12. [Sistema de Memória e RAG](#12-sistema-de-memória-e-rag)
13. [Sistema de Aprovação](#13-sistema-de-aprovação)
14. [API Endpoints](#14-api-endpoints)
15. [Schemas Pydantic](#15-schemas-pydantic)
16. [Configurações e Variáveis de Ambiente](#16-configurações-e-variáveis-de-ambiente)
17. [Requirements](#17-requirements)
18. [Priorização de Implementação](#18-priorização-de-implementação)
19. [Código Completo dos Arquivos](#19-código-completo-dos-arquivos)

---

# 1. VISÃO GERAL DO SISTEMA

## 1.1 Objetivo

A **Predictive Agency** é uma plataforma de automação de agência de marketing que utiliza múltiplos agentes de IA especializados para criar, validar e distribuir conteúdo de alta qualidade. O sistema simula uma agência completa com departamentos que se comunicam automaticamente.

## 1.2 Diferenciais

- **Orquestrador Inteligente**: Analisa a demanda e monta crews dinâmicas com apenas os agentes necessários
- **RAG Multi-tenant**: Cada cliente tem sua própria memória de marca isolada
- **Focus Group Sintético**: Personas simuladas avaliam o conteúdo antes da aprovação
- **Loop de Refinamento**: Conteúdo é refinado até atingir qualidade mínima
- **Especialistas por Plataforma**: Copywriters específicos para cada rede social
- **Sistema de Aprovação Configurável**: Flexível para diferentes níveis de controle

## 1.3 Fluxo Macro

```
DEMANDA ENTRADA
      │
      ▼
┌─────────────────┐
│  ORQUESTRADOR   │ ◄── Analisa tipo de demanda
│    CENTRAL      │ ◄── Seleciona agentes necessários
└────────┬────────┘ ◄── Monta crew dinâmica
         │
         ▼
┌─────────────────┐
│    RESEARCH     │ ◄── Pesquisa mercado, tendências, concorrência
│  INTELLIGENCE   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   ESTRATÉGIA    │ ◄── Head define abordagem baseado em RAG + Research
│      HEAD       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    CRIAÇÃO      │ ◄── Copywriters + Designers + Video especialistas
│   CONTEÚDO      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PERSUASÃO     │ ◄── CTA + Hook + Storytelling specialists
│   OTIMIZAÇÃO    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FOCUS GROUP    │ ◄── Personas avaliam (nota 0-10)
│   SINTÉTICO     │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Nota<7? │
    └────┬────┘
     SIM │ NÃO
      │   │
      ▼   ▼
  REFAZ  APROVA
      │   │
      └───┼───────────┐
          ▼           │
┌─────────────────┐   │
│ BRAND GUARDIAN  │◄──┘ Valida contra branding
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    APROVAÇÃO    │ ◄── Head OU SuperAdmin (configurável)
│     HUMANA      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AGENDAMENTO    │ ◄── Publica automaticamente
│   PUBLICAÇÃO    │
└─────────────────┘
```

---

# 2. ARQUITETURA GERAL

## 2.1 Diagrama de Componentes

```
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Seu Sistema)                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ REST API / Webhooks
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   /ingest   │  │  /create    │  │  /approve   │  │  /schedule  │ │
│  │   (RAG)     │  │  (Campaign) │  │  (Review)   │  │  (Publish)  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         ORCHESTRATOR LAYER                            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    MASTER ORCHESTRATOR                          │  │
│  │  • Analisa demanda                                              │  │
│  │  • Identifica tipo de trabalho                                  │  │
│  │  • Seleciona agentes necessários                                │  │
│  │  • Monta crew dinâmica                                          │  │
│  │  • Gerencia execução                                            │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           CREWS LAYER                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │   Content    │ │   Campaign   │ │     Web      │ │   Branding   ││
│  │    Crew      │ │    Crew      │ │    Crew      │ │    Crew      ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          AGENTS LAYER (~50 Agentes)                   │
│                                                                       │
│  STRATEGIC          CREATIVE           DISTRIBUTION      QUALITY     │
│  ┌──────────┐      ┌──────────┐       ┌──────────┐     ┌──────────┐ │
│  │ Planning │      │Direction │       │ Organic  │     │ Review   │ │
│  │Intelligence     │Copywriters       │ Paid     │     │ Personas │ │
│  │ Analytics│      │Persuasion│       │ Web      │     │          │ │
│  │ SEO      │      │ Design   │       │          │     │          │ │
│  │          │      │ Video    │       │          │     │          │ │
│  └──────────┘      └──────────┘       └──────────┘     └──────────┘ │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                           TOOLS LAYER                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Research │ │ Analytics│ │ Creation │ │Publishing│ │  Memory  │  │
│  │  Tools   │ │  Tools   │ │  Tools   │ │  Tools   │ │  Tools   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │
│  │   PostgreSQL  │  │   ChromaDB    │  │    Redis      │            │
│  │   (Dados)     │  │   (Vetores)   │  │   (Cache)     │            │
│  └───────────────┘  └───────────────┘  └───────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
```

## 2.2 Comunicação entre Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE COMUNICAÇÃO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend ──HTTP/JSON──► API ──Queue──► Orchestrator            │
│                                              │                   │
│                                              ▼                   │
│                                    ┌─────────────────┐          │
│                                    │  Crew Manager   │          │
│                                    └────────┬────────┘          │
│                                             │                   │
│            ┌────────────────────────────────┼────────────┐      │
│            ▼                ▼               ▼            ▼      │
│       Agent 1          Agent 2         Agent 3      Agent N    │
│            │                │               │            │      │
│            └────────────────┴───────────────┴────────────┘      │
│                              │                                   │
│                              ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  Shared Memory  │ (ChromaDB + Redis)       │
│                    └─────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# 3. ESTRUTURA DE PASTAS

```
/predictive_agency
│
├── /app
│   │
│   ├── /agents
│   │   │
│   │   ├── /strategic
│   │   │   ├── /planning
│   │   │   │   ├── __init__.py
│   │   │   │   ├── head_strategist.py
│   │   │   │   ├── campaign_planner.py
│   │   │   │   └── content_calendar_builder.py
│   │   │   │
│   │   │   ├── /intelligence
│   │   │   │   ├── __init__.py
│   │   │   │   ├── trend_hunter.py
│   │   │   │   ├── competitor_analyst.py
│   │   │   │   ├── hashtag_researcher.py
│   │   │   │   ├── viral_pattern_analyst.py
│   │   │   │   ├── audience_profiler.py
│   │   │   │   └── content_gap_finder.py
│   │   │   │
│   │   │   ├── /analytics
│   │   │   │   ├── __init__.py
│   │   │   │   ├── performance_analyst.py
│   │   │   │   ├── ab_test_designer.py
│   │   │   │   ├── best_time_analyst.py
│   │   │   │   ├── content_recycler.py
│   │   │   │   └── failure_analyst.py
│   │   │   │
│   │   │   └── /seo
│   │   │       ├── __init__.py
│   │   │       ├── seo_strategist.py
│   │   │       ├── keyword_researcher.py
│   │   │       ├── youtube_seo_expert.py
│   │   │       └── local_seo_expert.py
│   │   │
│   │   ├── /creative
│   │   │   ├── /direction
│   │   │   │   ├── __init__.py
│   │   │   │   ├── creative_director.py
│   │   │   │   ├── art_director.py
│   │   │   │   └── tone_of_voice_keeper.py
│   │   │   │
│   │   │   ├── /copywriters
│   │   │   │   ├── __init__.py
│   │   │   │   ├── copy_instagram_expert.py
│   │   │   │   ├── copy_linkedin_expert.py
│   │   │   │   ├── copy_youtube_expert.py
│   │   │   │   ├── copy_tiktok_expert.py
│   │   │   │   ├── copy_facebook_expert.py
│   │   │   │   ├── copy_twitter_expert.py
│   │   │   │   ├── copy_email_expert.py
│   │   │   │   ├── copy_ads_expert.py
│   │   │   │   └── copy_landing_page_expert.py
│   │   │   │
│   │   │   ├── /persuasion
│   │   │   │   ├── __init__.py
│   │   │   │   ├── cta_specialist.py
│   │   │   │   ├── hook_specialist.py
│   │   │   │   ├── storytelling_specialist.py
│   │   │   │   └── objection_handler.py
│   │   │   │
│   │   │   ├── /design
│   │   │   │   ├── __init__.py
│   │   │   │   ├── graphic_designer_posts.py
│   │   │   │   ├── graphic_designer_stories.py
│   │   │   │   ├── graphic_designer_carousels.py
│   │   │   │   ├── graphic_designer_ads.py
│   │   │   │   ├── graphic_designer_branding.py
│   │   │   │   └── thumbnail_designer.py
│   │   │   │
│   │   │   └── /video
│   │   │       ├── __init__.py
│   │   │       ├── video_script_writer.py
│   │   │       ├── video_hook_specialist.py
│   │   │       ├── video_editor_director.py
│   │   │       ├── reels_specialist.py
│   │   │       └── long_form_specialist.py
│   │   │
│   │   ├── /distribution
│   │   │   ├── /organic
│   │   │   │   ├── __init__.py
│   │   │   │   ├── social_media_manager.py
│   │   │   │   ├── community_manager.py
│   │   │   │   └── scheduler_agent.py
│   │   │   │
│   │   │   ├── /paid
│   │   │   │   ├── __init__.py
│   │   │   │   ├── traffic_manager.py
│   │   │   │   ├── meta_ads_specialist.py
│   │   │   │   ├── google_ads_specialist.py
│   │   │   │   ├── tiktok_ads_specialist.py
│   │   │   │   ├── linkedin_ads_specialist.py
│   │   │   │   ├── audience_builder.py
│   │   │   │   └── budget_optimizer.py
│   │   │   │
│   │   │   └── /web
│   │   │       ├── __init__.py
│   │   │       ├── web_developer.py
│   │   │       ├── landing_page_builder.py
│   │   │       └── funnel_architect.py
│   │   │
│   │   └── /quality
│   │       ├── /review
│   │       │   ├── __init__.py
│   │       │   ├── brand_guardian.py
│   │       │   ├── fact_checker.py
│   │       │   ├── compliance_checker.py
│   │       │   ├── plagiarism_detector.py
│   │       │   ├── sensitivity_reviewer.py
│   │       │   └── approval_manager.py
│   │       │
│   │       └── /personas
│   │           ├── __init__.py
│   │           ├── persona_skeptic.py
│   │           ├── persona_enthusiast.py
│   │           ├── persona_busy_executive.py
│   │           ├── persona_price_sensitive.py
│   │           ├── persona_technical.py
│   │           ├── persona_gen_z.py
│   │           ├── persona_boomer.py
│   │           └── persona_competitor_client.py
│   │
│   ├── /crews
│   │   ├── __init__.py
│   │   ├── /content
│   │   │   ├── __init__.py
│   │   │   ├── organic_content_crew.py
│   │   │   ├── paid_content_crew.py
│   │   │   ├── video_content_crew.py
│   │   │   └── carousel_crew.py
│   │   │
│   │   ├── /campaigns
│   │   │   ├── __init__.py
│   │   │   ├── traffic_campaign_crew.py
│   │   │   ├── launch_campaign_crew.py
│   │   │   └── evergreen_campaign_crew.py
│   │   │
│   │   ├── /projects
│   │   │   ├── __init__.py
│   │   │   ├── web_project_crew.py
│   │   │   ├── branding_project_crew.py
│   │   │   └── funnel_project_crew.py
│   │   │
│   │   └── /planning
│   │       ├── __init__.py
│   │       ├── monthly_planning_crew.py
│   │       ├── weekly_planning_crew.py
│   │       └── crisis_response_crew.py
│   │
│   ├── /orchestrator
│   │   ├── __init__.py
│   │   ├── master_orchestrator.py
│   │   ├── demand_analyzer.py
│   │   ├── crew_builder.py
│   │   └── execution_manager.py
│   │
│   ├── /tools
│   │   ├── __init__.py
│   │   ├── /research
│   │   │   ├── __init__.py
│   │   │   ├── web_search_tool.py
│   │   │   ├── perplexity_tool.py
│   │   │   ├── trend_search_tool.py
│   │   │   └── competitor_scraper_tool.py
│   │   │
│   │   ├── /analytics
│   │   │   ├── __init__.py
│   │   │   ├── meta_analytics_tool.py
│   │   │   ├── google_analytics_tool.py
│   │   │   └── youtube_analytics_tool.py
│   │   │
│   │   ├── /creation
│   │   │   ├── __init__.py
│   │   │   ├── image_prompt_tool.py
│   │   │   ├── image_generator_tool.py
│   │   │   └── video_prompt_tool.py
│   │   │
│   │   ├── /publishing
│   │   │   ├── __init__.py
│   │   │   ├── social_scheduler_tool.py
│   │   │   └── multi_platform_publisher_tool.py
│   │   │
│   │   └── /memory
│   │       ├── __init__.py
│   │       ├── rag_brand_tool.py
│   │       └── campaign_history_tool.py
│   │
│   ├── /workflows
│   │   ├── __init__.py
│   │   ├── task_router.py
│   │   ├── approval_flow.py
│   │   ├── dependency_manager.py
│   │   ├── deadline_tracker.py
│   │   └── notification_dispatcher.py
│   │
│   ├── /memory
│   │   ├── __init__.py
│   │   ├── /client
│   │   │   ├── __init__.py
│   │   │   ├── brand_memory.py
│   │   │   ├── voice_memory.py
│   │   │   └── visual_memory.py
│   │   │
│   │   └── /learning
│   │       ├── __init__.py
│   │       ├── campaign_learnings.py
│   │       ├── performance_patterns.py
│   │       └── failure_learnings.py
│   │
│   ├── /api
│   │   ├── __init__.py
│   │   ├── endpoints.py
│   │   ├── webhooks.py
│   │   ├── schemas.py
│   │   └── middleware.py
│   │
│   ├── /db
│   │   ├── __init__.py
│   │   ├── models.py
│   │   ├── database.py
│   │   └── /repositories
│   │       ├── __init__.py
│   │       ├── client_repository.py
│   │       ├── task_repository.py
│   │       ├── campaign_repository.py
│   │       └── content_repository.py
│   │
│   └── /core
│       ├── __init__.py
│       ├── config.py
│       ├── llm_config.py
│       ├── constants.py
│       └── exceptions.py
│
├── /uploads
│   └── /brands
│       └── /{client_id}
│           └── manual_marca.pdf
│
├── /chroma_db
│   └── /{client_id}
│
├── /logs
│   ├── app.log
│   ├── agents.log
│   └── api.log
│
├── /tests
│   ├── __init__.py
│   ├── /unit
│   └── /integration
│
├── main.py
├── requirements.txt
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
└── README.md
```

---

# 4. TECH STACK

## 4.1 Core

| Componente | Tecnologia | Versão | Justificativa |
|------------|------------|--------|---------------|
| Linguagem | Python | 3.11+ | Melhor suporte a async e typing |
| Framework de Agentes | CrewAI | Latest | Orquestração multi-agente robusta |
| API Framework | FastAPI | 0.109+ | Performance + async + documentação automática |
| Task Queue | Celery | 5.3+ | Processamento assíncrono escalável |
| Cache/Queue | Redis | 7+ | Velocidade + Pub/Sub |

## 4.2 Supabase (Backend Unificado)

| Componente | Recurso Supabase | Uso |
|------------|------------------|-----|
| Banco de Dados | PostgreSQL | Dados estruturados, histórico, configurações |
| Vetores (RAG) | pgvector | Embeddings de branding, memória de marca |
| Storage | Supabase Storage | PDFs de manuais de marca, assets |
| Auth | Supabase Auth | Autenticação de usuários/admins |
| Realtime | Supabase Realtime | Notificações de status em tempo real |

## 4.3 LLMs e IA

| Componente | Tecnologia | Uso |
|------------|------------|-----|
| LLM Principal | GPT-4o (OpenAI) | Agentes principais, criação de conteúdo |
| LLM Secundário | Claude 3.5 Sonnet (Anthropic) | Análise, revisão, fallback |
| Pesquisa | Perplexity Sonar | Research em tempo real, tendências |
| Embeddings | OpenAI text-embedding-3-small | Vetorização para RAG |

## 4.4 Integrações Externas

| Plataforma | API/SDK | Funcionalidade |
|------------|---------|----------------|
| Instagram | Meta Graph API | Publicação, métricas, stories |
| Facebook | Meta Graph API | Publicação, métricas, grupos |
| LinkedIn | LinkedIn API | Posts, artigos, métricas |
| YouTube | YouTube Data API | Upload, thumbnails, métricas |
| TikTok | TikTok API | Publicação, métricas |
| X/Twitter | X API v2 | Tweets, threads, métricas |
| Google Ads | Google Ads API | Campanhas, conversões |
| Meta Ads | Marketing API | Campanhas, públicos, métricas |

## 4.5 Repositório e DevOps

| Componente | Tecnologia | Uso |
|------------|------------|-----|
| Versionamento | GitHub | Código fonte, CI/CD |
| Containerização | Docker | Ambiente consistente |
| Orquestração | Docker Compose | Dev local |

---

# 5. ORQUESTRADOR CENTRAL

## 5.1 Visão Geral

O **Master Orchestrator** é o cérebro do sistema. Ele recebe todas as demandas e decide dinamicamente quais agentes serão ativados para cada tarefa.

## 5.2 Responsabilidades

1. **Análise de Demanda**: Classifica o tipo de trabalho solicitado
2. **Seleção de Agentes**: Escolhe apenas os agentes necessários
3. **Montagem de Crew**: Cria a crew dinâmica para a tarefa
4. **Gerenciamento de Execução**: Monitora e coordena a execução
5. **Tratamento de Erros**: Gerencia falhas e retentativas

## 5.3 Tipos de Demanda Reconhecidos

```python
class DemandType(Enum):
    # Conteúdo Orgânico
    POST_INSTAGRAM = "post_instagram"
    POST_LINKEDIN = "post_linkedin"
    POST_FACEBOOK = "post_facebook"
    POST_TWITTER = "post_twitter"
    POST_TIKTOK = "post_tiktok"
    CAROUSEL = "carousel"
    STORIES = "stories"
    REELS = "reels"
    
    # Vídeo
    VIDEO_SHORT = "video_short"          # < 60s
    VIDEO_MEDIUM = "video_medium"        # 1-10 min
    VIDEO_LONG = "video_long"            # > 10 min
    VIDEO_YOUTUBE = "video_youtube"
    
    # Email Marketing
    EMAIL_NEWSLETTER = "email_newsletter"
    EMAIL_SEQUENCE = "email_sequence"
    EMAIL_COLD = "email_cold"
    
    # Tráfego Pago
    CAMPAIGN_META = "campaign_meta"
    CAMPAIGN_GOOGLE = "campaign_google"
    CAMPAIGN_TIKTOK = "campaign_tiktok"
    CAMPAIGN_LINKEDIN = "campaign_linkedin"
    
    # Web
    LANDING_PAGE = "landing_page"
    WEBSITE = "website"
    FUNNEL = "funnel"
    
    # Branding
    BRAND_IDENTITY = "brand_identity"
    BRAND_REFRESH = "brand_refresh"
    
    # Planejamento
    PLANNING_MONTHLY = "planning_monthly"
    PLANNING_WEEKLY = "planning_weekly"
    PLANNING_CAMPAIGN = "planning_campaign"
```

## 5.4 Mapeamento Demanda → Agentes

```python
DEMAND_AGENT_MAPPING = {
    DemandType.POST_INSTAGRAM: {
        "required": [
            "head_strategist",
            "copy_instagram_expert",
            "graphic