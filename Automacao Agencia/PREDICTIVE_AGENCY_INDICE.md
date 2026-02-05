# 🚀 PREDICTIVE AGENCY - ÍNDICE E INSTRUÇÕES

## Arquivos do Blueprint

Este blueprint está dividido em 2 partes para melhor organização:

### 📄 PARTE 1: Arquitetura e Estrutura
`PREDICTIVE_AGENCY_BLUEPRINT_PARTE1.md`

Contém:
- Visão geral do sistema
- Arquitetura e diagramas
- Estrutura de pastas completa
- Tech Stack (Supabase, CrewAI, FastAPI)
- Orquestrador Central
- Mapeamento Demanda → Agentes

### 📄 PARTE 2: Código dos Agentes
`PREDICTIVE_AGENCY_BLUEPRINT_PARTE2.md`

Contém:
- Código completo de todos os agentes
- Tools (Perplexity Sonar, RAG, etc)
- Configurações
- Agent Factory
- Instruções de implementação

---

## 🎯 Como Usar no Cursor

### Passo 1: Preparar o Ambiente

```bash
mkdir predictive_agency
cd predictive_agency
git init
```

### Passo 2: Abrir no Cursor

Abra a pasta no Cursor IDE.

### Passo 3: Usar o Composer (Cmd+I ou Ctrl+I)

Cole a PARTE 1 primeiro e peça:
```
Crie a estrutura de pastas conforme este blueprint
```

Depois cole a PARTE 2 e peça:
```
Implemente os agentes marcados como [MVP]
```

### Passo 4: Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Habilite a extensão pgvector
3. Execute o SQL de criação das tabelas
4. Copie as chaves para o `.env`

### Passo 5: Instalar e Rodar

```bash
pip install -r requirements.txt
python main.py
```

---

## 📊 Resumo do Sistema

| Componente | Quantidade | Fase |
|------------|------------|------|
| Agentes Estratégicos | 15 | MVP: 4, Fase 2: 6, Fase 3: 5 |
| Agentes Criativos | 20 | MVP: 10, Fase 2: 7, Fase 3: 3 |
| Agentes Distribuição | 12 | MVP: 4, Fase 2: 5, Fase 3: 3 |
| Agentes Qualidade | 12 | MVP: 5, Fase 2: 4, Fase 3: 3 |
| **Total** | **~50** | **MVP: 23** |

---

## 🔧 Tech Stack

- **Backend**: Python 3.11+ / FastAPI
- **Agentes**: CrewAI
- **Banco de Dados**: Supabase (PostgreSQL + pgvector)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **LLMs**: OpenAI GPT-4o + Claude 3.5 Sonnet
- **Pesquisa**: Perplexity Sonar
- **Task Queue**: Celery + Redis
- **Repositório**: GitHub

---

## ⚡ MVP (Semanas 1-2)

### Agentes MVP (23 agentes):
1. head_strategist
2. trend_hunter
3. competitor_analyst
4. campaign_planner
5. copy_instagram_expert
6. copy_linkedin_expert
7. copy_youtube_expert
8. copy_ads_expert
9. cta_specialist
10. hook_specialist
11. graphic_designer_posts
12. graphic_designer_carousels
13. video_script_writer
14. video_hook_specialist
15. reels_specialist
16. social_media_manager
17. scheduler_agent
18. traffic_manager
19. meta_ads_specialist
20. brand_guardian
21. persona_skeptic
22. persona_enthusiast
23. persona_busy_executive

### Funcionalidades MVP:
- Upload de PDF de marca (RAG)
- Criação de post Instagram
- Criação de post LinkedIn
- Criação de campanha Meta Ads
- Focus Group sintético
- Loop de refinamento
- Sistema de aprovação (Level 1)

---

## 📞 Suporte

Dúvidas sobre a implementação? 
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

---

**Bom trabalho! 🚀**
