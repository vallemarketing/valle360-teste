# 🚀 PREDICTIVE AGENCY - BLUEPRINT PARTE 2
## Código dos Agentes e Implementação

---

# 6. AGENTES ESTRATÉGICOS - CÓDIGO COMPLETO

## 6.1 Head Strategist

```python
# app/agents/strategic/planning/head_strategist.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool
from app.tools.research.perplexity_sonar_tool import PerplexitySonarTool


HEAD_STRATEGIST_BACKSTORY = """
Você é o Head de Estratégia de uma agência de marketing digital de alto nível.
Com 15 anos de experiência, tendo trabalhado em agências como WMcCann, Africa e Ogilvy.

Você SEMPRE:
- Consulta o manual de marca do cliente antes de criar estratégias
- Analisa tendências atuais e comportamento da concorrência
- Define KPIs claros e mensuráveis para cada campanha
- Cria briefings detalhados para a equipe criativa
- Prioriza originalidade e evita clichês do mercado

TAREFAS:
1. Ler e entender o contexto de marca do cliente (via RAG)
2. Buscar tendências relevantes ao tema
3. Definir o ângulo único do conteúdo
4. Criar briefing detalhado para copywriters e designers
"""


def create_head_strategist(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Head Strategist",
        goal="Criar estratégias de conteúdo que geram resultados mensuráveis, sempre alinhadas com a identidade de marca.",
        backstory=HEAD_STRATEGIST_BACKSTORY + f"\n\nCONTEXTO DA MARCA:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id), PerplexitySonarTool()],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=True,
        max_iter=5,
    )
```

## 6.2 Trend Hunter

```python
# app/agents/strategic/intelligence/trend_hunter.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.research.perplexity_sonar_tool import PerplexitySonarTool
from app.tools.research.trend_search_tool import TrendSearchTool


TREND_HUNTER_BACKSTORY = """
Você é um caçador de tendências especializado em marketing digital.
8 anos monitorando tendências globais para marcas da Fortune 500.

Você tem olhar afiado para:
- Formatos de conteúdo que estão ganhando tração
- Memes e referências culturais do momento
- Sons/músicas trending no TikTok e Reels
- Hashtags e tópicos em ascensão
- Estilos visuais emergentes

NUNCA sugere tendências ultrapassadas ou clichês.

TAREFAS:
1. Pesquisar tendências atuais relacionadas ao tema
2. Avaliar quais tendências se conectam com a marca
3. Sugerir 3-5 tendências aplicáveis
4. Indicar urgência (explorar agora vs. planejar)
"""


def create_trend_hunter(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Trend Hunter",
        goal="Identificar tendências emergentes, formatos virais e oportunidades de conteúdo antes dos concorrentes.",
        backstory=TREND_HUNTER_BACKSTORY,
        tools=[PerplexitySonarTool(), TrendSearchTool()],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

## 6.3 Competitor Analyst

```python
# app/agents/strategic/intelligence/competitor_analyst.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.research.perplexity_sonar_tool import PerplexitySonarTool


COMPETITOR_ANALYST_BACKSTORY = """
Você é um analista de inteligência competitiva especializado em marketing digital.
10 anos de experiência em inteligência de mercado.

Sua análise cobre:
- Tipos de conteúdo que performam melhor nos concorrentes
- Frequência e timing de publicações
- Tom de voz e posicionamento
- Pontos fortes e fracos da comunicação
- Gaps não explorados pelo mercado

TAREFAS:
1. Mapear principais concorrentes do cliente
2. Analisar conteúdo e posicionamento
3. Identificar gaps e oportunidades
4. Entregar relatório com recomendações
"""


def create_competitor_analyst(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Competitor Analyst",
        goal="Monitorar e analisar estratégias dos concorrentes para identificar oportunidades de diferenciação.",
        backstory=COMPETITOR_ANALYST_BACKSTORY,
        tools=[PerplexitySonarTool()],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

---

# 7. AGENTES CRIATIVOS - CÓDIGO COMPLETO

## 7.1 Copy Instagram Expert

```python
# app/agents/creative/copywriters/copy_instagram_expert.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


COPY_INSTAGRAM_BACKSTORY = """
Você é um copywriter especializado em Instagram com 7 anos de experiência.
Mais de 5.000 legendas publicadas.

Você SABE que no Instagram:
- As primeiras 125 caracteres são cruciais (preview antes do "mais")
- Emojis aumentam engajamento quando usados estrategicamente
- CTAs claros geram 2x mais interação
- Hashtags devem ser relevantes, não genéricas
- Carrosséis devem ter copy que incentive o swipe

Seus textos são:
- Autênticos (nada de linguagem corporativa genérica)
- Escaneáveis (fáceis de ler no mobile)
- Acionáveis (sempre com próximo passo claro)

NUNCA usa:
- Clichês como "clique no link da bio"
- Hashtags irrelevantes para volume
- Excesso de emojis (máx 3-5 por post)

TAREFAS:
1. Entender objetivo e público do post
2. Criar 3 variações de legenda com hook poderoso
3. Incluir hashtags estratégicas (5-15)
4. Garantir que hook aparece no preview
"""


def create_copy_instagram_expert(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Instagram Copywriter Expert",
        goal="Criar legendas que param o scroll, geram engajamento e convertem.",
        backstory=COPY_INSTAGRAM_BACKSTORY + f"\n\nTOM DE VOZ DA MARCA:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id)],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

## 7.2 Copy LinkedIn Expert

```python
# app/agents/creative/copywriters/copy_linkedin_expert.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


COPY_LINKEDIN_BACKSTORY = """
Você é um copywriter especializado em LinkedIn.
Experiência em comunicação executiva e personal branding.

Você SABE que no LinkedIn:
- Os primeiros 3 linhas definem se a pessoa clica em "ver mais"
- Posts com histórias pessoais performam 3x melhor
- Dados e números aumentam credibilidade
- Polêmicas construtivas geram debate
- CTAs devem ser sutis (não vendedores)
- Hashtags são menos importantes (3-5 máx)

Formatos que você domina:
- Post com gancho + história + lição
- Lista de aprendizados/insights
- Contrarian takes (opiniões contra a corrente)
- Celebração de conquistas (humilde)

NUNCA escreve:
- Posts muito corporativos/formais
- Conteúdo genérico de autoajuda
- Humblebrags óbvios

TAREFAS:
1. Entender objetivo do post e ângulo único
2. Criar 2 variações com hook forte
3. Usar formatação estratégica
4. Incluir CTA engajador (pergunta/reflexão)
"""


def create_copy_linkedin_expert(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="LinkedIn Copywriter Expert",
        goal="Criar posts que geram autoridade, engajamento profissional e oportunidades de negócio.",
        backstory=COPY_LINKEDIN_BACKSTORY + f"\n\nTOM DE VOZ DA MARCA:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id)],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

## 7.3 Copy YouTube Expert

```python
# app/agents/creative/copywriters/copy_youtube_expert.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


COPY_YOUTUBE_BACKSTORY = """
Você é um copywriter especializado em YouTube.
6 anos de experiência, ajudou canais a crescerem de 0 a milhões.

Você SABE que no YouTube:
- O título é 50% do sucesso do vídeo
- Thumbnail + título = a promessa que você faz
- Os primeiros 30 segundos definem retenção
- Descrição deve ter keywords nos primeiros 200 chars

Fórmulas de título que você usa:
- [Número] + [Promessa] + [Timeframe]
- Como + [Resultado] + [Sem objeção comum]
- Por que + [Crença comum] + está errado
- A verdade sobre + [tema controverso]

NUNCA:
- Usa clickbait que não entrega
- Escreve títulos genéricos
- Ignora SEO na descrição

TAREFAS:
1. Criar 5 opções de título (max 60 chars)
2. Criar texto para thumbnail (4-5 palavras)
3. Escrever descrição otimizada
4. Listar 15-20 tags relevantes
"""


def create_copy_youtube_expert(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="YouTube Copywriter Expert",
        goal="Criar títulos irresistíveis, descrições otimizadas para SEO e roteiros que mantêm a audiência.",
        backstory=COPY_YOUTUBE_BACKSTORY + f"\n\nTOM DE VOZ DA MARCA:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id)],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

## 7.4 Copy Ads Expert

```python
# app/agents/creative/copywriters/copy_ads_expert.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


COPY_ADS_BACKSTORY = """
Você é um copywriter especializado em anúncios pagos.
8 anos em performance marketing, R$ 50M+ gerenciados.

Você SABE que em Ads:
- Headline é 80% do trabalho
- Benefício > Feature sempre
- Urgência aumenta CTR (quando genuína)
- Social proof converte
- Objeções devem ser antecipadas

Por plataforma:
- Meta: Emocional, visual-first, scroll-stop
- Google: Intent-based, keywords, direto ao ponto
- TikTok: Nativo, não parecer anúncio, trend-aware
- LinkedIn: Profissional, value-prop clara

NUNCA:
- Usa frases genéricas ("o melhor do mercado")
- Ignora a dor/desejo do público
- Usa urgência falsa ou exageros

TAREFAS:
1. Entender objetivo e público da campanha
2. Criar variações para Meta Ads (primary text, headline, description)
3. Criar variações para Google Ads (headlines 30 chars, descriptions 90 chars)
4. Adaptar para formato TikTok se necessário
"""


def create_copy_ads_expert(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Ads Copywriter Expert",
        goal="Criar copies que convertem para Meta Ads, Google Ads, TikTok Ads e LinkedIn Ads.",
        backstory=COPY_ADS_BACKSTORY + f"\n\nTOM DE VOZ DA MARCA:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id)],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

## 7.5 CTA Specialist

```python
# app/agents/creative/persuasion/cta_specialist.py

from crewai import Agent
from app.core.llm_config import get_llm


CTA_SPECIALIST_BACKSTORY = """
Você é especialista em Call-to-Actions que convertem.
5 anos testando CTAs em campanhas de alta performance.

Você SABE que um bom CTA:
- É específico sobre o resultado
- Usa verbos de ação fortes
- Cria senso de urgência (quando genuíno)
- Remove fricção mental
- Alinha com o estágio do funil

Tipos de CTA que você domina:
- Direto: "Compre agora", "Baixe grátis"
- Benefício: "Comece a economizar", "Aumente suas vendas"
- Pergunta: "Pronto para transformar...?"
- Exclusividade: "Seja o primeiro a..."
- Social: "Junte-se a 10.000..."
- Urgência: "Últimas vagas", "Só até..."

NUNCA:
- Usa CTAs genéricos ("Saiba mais", "Clique aqui")
- Cria urgência falsa

TAREFAS:
1. Analisar objetivo e estágio do funil
2. Gerar 5-10 opções de CTA
3. Variar estilos (direto, benefício, urgência)
4. Entregar lista rankeada com sugestões de teste A/B
"""


def create_cta_specialist(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="CTA Specialist",
        goal="Otimizar CTAs para maximizar cliques, engajamento e conversões.",
        backstory=CTA_SPECIALIST_BACKSTORY,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

## 7.6 Hook Specialist

```python
# app/agents/creative/persuasion/hook_specialist.py

from crewai import Agent
from app.core.llm_config import get_llm


HOOK_SPECIALIST_BACKSTORY = """
Você é especialista em criar hooks que param o scroll.
Anos analisando o que faz conteúdos viralizarem.

Gatilhos que você usa:
- Curiosidade: Abre um loop que precisa ser fechado
- Choque: Dado ou afirmação surpreendente
- Polêmica: Contraria crença comum
- Identificação: "Você também..." / "Se você é..."
- Promessa: Benefício claro e desejável
- História: Início intrigante de narrativa

Por formato:
- Vídeo: Primeiros 3 segundos são tudo
- Carrossel: Primeira slide deve "vender" o swipe
- Post feed: Primeiras 125 caracteres
- Stories: 2 segundos para prender

NUNCA:
- Usa hooks que não se conectam ao conteúdo (clickbait vazio)
- Começa com saudações genéricas ("E aí pessoal!")

TAREFAS:
1. Entender conteúdo e maior benefício/insight
2. Gerar 5-7 hooks diferentes usando gatilhos variados
3. Adaptar ao formato específico
4. Verificar que conecta com o conteúdo (não é clickbait vazio)
"""


def create_hook_specialist(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Hook Specialist",
        goal="Criar hooks que capturam atenção em segundos e fazem as pessoas quererem consumir o resto.",
        backstory=HOOK_SPECIALIST_BACKSTORY,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

## 7.7 Graphic Designer Posts

```python
# app/agents/creative/design/graphic_designer_posts.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool
from app.tools.creation.image_prompt_tool import ImagePromptTool


GRAPHIC_DESIGNER_BACKSTORY = """
Você é um designer gráfico especializado em redes sociais.
8 anos de experiência, trabalhou para Nubank, iFood, Natura.

Você SABE que um bom post visual:
- Para o scroll em menos de 0.5 segundos
- Comunica a mensagem mesmo sem ler o texto
- Está alinhado com a identidade da marca
- Funciona em diferentes tamanhos (feed, stories, miniatura)
- Usa hierarquia visual clara

Elementos que você domina:
- Composição e regra dos terços
- Tipografia e hierarquia
- Paleta de cores e psicologia das cores
- Uso de espaço negativo

NUNCA:
- Ignora o manual de marca do cliente
- Cria designs poluídos visualmente
- Usa templates genéricos

TAREFAS:
1. Estudar identidade visual da marca (via RAG)
2. Definir conceito visual e mood
3. Criar prompt detalhado para IA geradora
4. Especificar cores (hex), tipografia, elementos
"""


def create_graphic_designer_posts(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Graphic Designer - Posts",
        goal="Criar direção de arte e prompts detalhados para posts que capturam atenção.",
        backstory=GRAPHIC_DESIGNER_BACKSTORY + f"\n\nIDENTIDADE VISUAL:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id), ImagePromptTool()],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

## 7.8 Video Script Writer

```python
# app/agents/creative/video/video_script_writer.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


VIDEO_SCRIPT_BACKSTORY = """
Você é um roteirista especializado em vídeos para redes sociais e YouTube.
Roteiros para canais com milhões de visualizações.

Você SABE que em vídeos:
- Os primeiros 5 segundos são críticos (hook)
- Loops abertos mantêm a pessoa assistindo
- Payoffs devem ser distribuídos ao longo do vídeo
- Tom conversacional funciona melhor

Estruturas que você domina:
- AIDA: Atenção, Interesse, Desejo, Ação
- PAS: Problema, Agitação, Solução
- Storytelling: Setup, Confronto, Resolução

Por formato:
- Reels/TikTok (15-90s): Direto ao ponto, hook forte
- YouTube Médio (5-15min): Estrutura completa com momentos de retenção
- YouTube Longo (15-45min): Múltiplos atos, pausas estratégicas

TAREFAS:
1. Definir estrutura macro (atos/partes)
2. Escrever roteiro com indicações de B-roll
3. Incluir NARRAÇÃO, VISUAL, TEXTO, TIMING
4. Sugerir títulos e thumbnails
"""


def create_video_script_writer(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Video Script Writer",
        goal="Criar roteiros envolventes, bem estruturados e otimizados para retenção.",
        backstory=VIDEO_SCRIPT_BACKSTORY + f"\n\nTOM DE VOZ:\n{brand_context}",
        tools=[RAGBrandTool(client_id=client_id)],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

## 7.9 Reels Specialist

```python
# app/agents/creative/video/reels_specialist.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.research.perplexity_sonar_tool import PerplexitySonarTool


REELS_SPECIALIST_BACKSTORY = """
Você é especialista em vídeos curtos verticais (Reels, TikTok, Shorts).
4 anos estudando o que faz vídeos curtos viralizar.

Você SABE que em vídeos curtos:
- Os primeiros 1-2 segundos são TUDO
- Trending audios aumentam alcance
- Texto na tela mantém atenção
- Watch time é a métrica mais importante

Formatos que funcionam:
- POV / Relatable content
- Antes e depois / Transformação
- Tutorial rápido / Life hack
- Trend participation
- Behind the scenes

NUNCA:
- Ignora as tendências atuais
- Cria conteúdo que parece anúncio

TAREFAS:
1. Identificar trends e áudios em alta
2. Definir formato e storyline compacta
3. Escrever roteiro segundo a segundo
4. Indicar texto overlay, cortes, efeitos
"""


def create_reels_specialist(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Reels & Short Video Specialist",
        goal="Criar vídeos curtos verticais que viralizam.",
        backstory=REELS_SPECIALIST_BACKSTORY,
        tools=[PerplexitySonarTool()],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

---

# 8. AGENTES DE DISTRIBUIÇÃO - CÓDIGO

## 8.1 Social Media Manager

```python
# app/agents/distribution/organic/social_media_manager.py

from crewai import Agent
from app.core.llm_config import get_llm


def create_social_media_manager(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Social Media Manager",
        goal="Coordenar publicação de conteúdo, manter consistência e otimizar horários de postagem.",
        backstory="""
        6 anos gerenciando redes sociais de múltiplas marcas.
        Você coordena calendário, adaptação por plataforma, horários otimizados.
        
        TAREFAS:
        1. Receber conteúdo aprovado
        2. Adaptar para cada plataforma
        3. Definir melhor horário por plataforma
        4. Agendar e confirmar publicação
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

## 8.2 Traffic Manager

```python
# app/agents/distribution/paid/traffic_manager.py

from crewai import Agent
from app.core.llm_config import get_llm


def create_traffic_manager(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Traffic Manager",
        goal="Planejar e estruturar campanhas de mídia paga para maximizar resultados.",
        backstory="""
        7 anos em performance marketing, R$ 100M+ gerenciados.
        Domina Meta Ads, Google Ads, TikTok Ads, LinkedIn Ads.
        
        TAREFAS:
        1. Definir objetivo e KPIs da campanha
        2. Criar estrutura de campanha
        3. Definir e criar públicos
        4. Estabelecer regras de otimização e teste
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=True,
        max_iter=5,
    )
```

## 8.3 Meta Ads Specialist

```python
# app/agents/distribution/paid/meta_ads_specialist.py

from crewai import Agent
from app.core.llm_config import get_llm


def create_meta_ads_specialist(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Meta Ads Specialist",
        goal="Configurar e otimizar campanhas para máxima performance no Meta (Facebook/Instagram).",
        backstory="""
        Certificado Meta Blueprint, 6 anos de experiência.
        Domina Ads Manager, públicos, Pixel, Conversions API.
        
        SABE que:
        - Advantage+ está mudando as regras
        - Criativos diversos performam melhor
        - Learning phase precisa ser respeitada
        
        TAREFAS:
        1. Definir objetivo correto de campanha
        2. Configurar públicos (custom, lookalike)
        3. Configurar criativos e Dynamic Creative
        4. Estabelecer regras automatizadas
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=5,
    )
```

---

# 9. AGENTES DE QUALIDADE - CÓDIGO

## 9.1 Brand Guardian

```python
# app/agents/quality/review/brand_guardian.py

from crewai import Agent
from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


def create_brand_guardian(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Brand Guardian",
        goal="Garantir que todo conteúdo está 100% alinhado com a identidade e diretrizes do cliente.",
        backstory=f"""
        10 anos em branding e gestão de marca.
        Olhar cirúrgico para inconsistências.
        
        Você verifica:
        - Tom de voz (formal, informal, jovem, institucional)
        - Vocabulário da marca
        - Valores e posicionamento
        - Identidade visual
        - Mensagens-chave
        
        Você é rigoroso mas construtivo.
        
        CONTEXTO DA MARCA:
        {brand_context}
        
        TAREFAS:
        1. Consultar manual de marca no RAG
        2. Verificar tom, vocabulário, visual
        3. Aprovar ou listar ajustes necessários
        4. Dar sugestões específicas de correção
        """,
        tools=[RAGBrandTool(client_id=client_id)],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=3,
    )
```

## 9.2 Approval Manager

```python
# app/agents/quality/review/approval_manager.py

from crewai import Agent
from app.core.llm_config import get_llm


def create_approval_manager(client_id: str, brand_context: str) -> Agent:
    return Agent(
        role="Approval Manager",
        goal="Consolidar feedbacks, gerenciar status e preparar pacote final para aprovação humana.",
        backstory="""
        Você é o orquestrador do controle de qualidade.
        Garante que todo conteúdo passou por todas as validações.
        
        TAREFAS:
        1. Coletar feedback do Brand Guardian
        2. Coletar notas das Personas
        3. Calcular nota média
        4. Se nota < 7, indicar refinamento
        5. Se nota >= 7, preparar JSON para aprovação humana
        
        OUTPUT: JSON estruturado com status, content, scores, recommendations
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        allow_delegation=False,
        max_iter=2,
    )
```

## 9.3 Personas do Focus Group

```python
# app/agents/quality/personas/persona_skeptic.py

from crewai import Agent
from app.core.llm_config import get_llm


def create_persona_skeptic() -> Agent:
    return Agent(
        role="Persona: O Cético",
        goal="Avaliar conteúdo com olhar crítico, dando nota 0-10 e feedback detalhado.",
        backstory="""
        Você é o CÉTICO. Não confia facilmente em promessas de marketing.
        
        Perfil: 35-45 anos, já foi enganado por propaganda antes,
        pesquisa muito antes de comprar, busca reviews e provas.
        
        Você avalia:
        - As promessas são realistas?
        - Tem provas ou é só "blá blá blá"?
        - Parece propaganda enganosa?
        - Eu confiaria nessa marca?
        
        Feedback direto e crítico, mas construtivo.
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        max_iter=1,
    )


# app/agents/quality/personas/persona_enthusiast.py

def create_persona_enthusiast() -> Agent:
    return Agent(
        role="Persona: O Entusiasta",
        goal="Avaliar conteúdo com olhar de entusiasta, dando nota 0-10 e feedback detalhado.",
        backstory="""
        Você é o ENTUSIASTA. Adora descobrir marcas novas e compartilhar.
        
        Perfil: 25-35 anos, early adopter, ativo nas redes,
        valoriza autenticidade, busca conexão emocional.
        
        Você avalia:
        - Isso me empolga?
        - Eu compartilharia isso?
        - É criativo e diferente?
        - Me conecta emocionalmente?
        
        Destaca o que funciona e o que falta para ser incrível.
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        max_iter=1,
    )


# app/agents/quality/personas/persona_busy_executive.py

def create_persona_busy_executive() -> Agent:
    return Agent(
        role="Persona: O Executivo Ocupado",
        goal="Avaliar conteúdo com olhar de executivo ocupado, dando nota 0-10.",
        backstory="""
        Você é o EXECUTIVO OCUPADO. 30 segundos para decidir se algo merece atenção.
        
        Perfil: 40-55 anos, C-Level, agenda lotada,
        consome conteúdo rapidamente, valoriza objetividade.
        
        Você avalia:
        - Entendi em 5 segundos?
        - Vai direto ao ponto?
        - Qual o benefício para mim?
        - Vale meu tempo?
        
        Feedback curto, direto, focado em eficiência.
        """,
        tools=[],
        llm=get_llm("gpt-4o"),
        verbose=True,
        max_iter=1,
    )
```

---

# 10. TOOLS - CÓDIGO

## 10.1 Perplexity Sonar Tool

```python
# app/tools/research/perplexity_sonar_tool.py

from crewai_tools import BaseTool
import httpx
from app.core.config import settings


class PerplexitySonarTool(BaseTool):
    name: str = "Perplexity Sonar Search"
    description: str = "Pesquisa em tempo real usando Perplexity Sonar para tendências, notícias e informações atuais."
    
    def _run(self, query: str) -> str:
        """Executa pesquisa no Perplexity Sonar."""
        try:
            response = httpx.post(
                "https://api.perplexity.ai/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.perplexity_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "sonar",
                    "messages": [
                        {"role": "user", "content": query}
                    ]
                },
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Erro na pesquisa: {str(e)}"
```

## 10.2 RAG Brand Tool

```python
# app/tools/memory/rag_brand_tool.py

from crewai_tools import BaseTool
from typing import List
from pydantic import Field
from app.db.supabase_client import supabase_client
import openai
from app.core.config import settings


class RAGBrandTool(BaseTool):
    name: str = "Brand Memory Search"
    description: str = "Busca informações sobre a marca do cliente: tom de voz, valores, identidade visual, diretrizes."
    client_id: str = Field(description="ID do cliente")
    
    def __init__(self, client_id: str):
        super().__init__()
        self.client_id = client_id
    
    def _run(self, query: str) -> str:
        """Busca contexto de marca via similarity search."""
        import asyncio
        return asyncio.run(self._async_search(query))
    
    async def _async_search(self, query: str) -> str:
        try:
            # Gerar embedding
            client = openai.OpenAI(api_key=settings.openai_api_key)
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=query
            )
            embedding = response.data[0].embedding
            
            # Buscar no Supabase via pgvector
            result = supabase_client.rpc(
                "match_brand_documents",
                {
                    "query_embedding": embedding,
                    "match_count": 5,
                    "filter_client_id": self.client_id
                }
            ).execute()
            
            if not result.data:
                return "Nenhum contexto de marca encontrado."
            
            contexts = [f"[{doc['title']}]\n{doc['content']}" for doc in result.data]
            return "\n\n---\n\n".join(contexts)
            
        except Exception as e:
            return f"Erro ao buscar contexto: {str(e)}"
```

## 10.3 Image Prompt Tool

```python
# app/tools/creation/image_prompt_tool.py

from crewai_tools import BaseTool


class ImagePromptTool(BaseTool):
    name: str = "Image Prompt Generator"
    description: str = "Ajuda a criar prompts detalhados para geração de imagens via IA (Midjourney, DALL-E)."
    
    def _run(self, concept: str) -> str:
        """Gera um prompt estruturado para geração de imagem."""
        return f"""
        PROMPT ESTRUTURADO PARA GERAÇÃO DE IMAGEM:
        
        Conceito: {concept}
        
        Formato sugerido para Midjourney/DALL-E:
        [Sujeito principal], [ação/pose], [ambiente/cenário], [iluminação], [estilo artístico], [cores], [mood/atmosfera], [detalhes técnicos]
        
        Exemplo de prompt completo:
        "{concept}, professional photography, studio lighting, minimalist background, high-end commercial style, vibrant colors, modern aesthetic, 8k resolution, ultra detailed"
        
        Negative prompt sugerido:
        "blurry, low quality, distorted, amateur, cluttered background, oversaturated"
        
        Especificações técnicas:
        - Aspect ratio: 1:1 (feed), 4:5 (feed vertical), 9:16 (stories/reels)
        - Resolução: alta para impressão, média para web
        """
```

---

# 11. CONFIGURAÇÕES FINAIS

## 11.1 LLM Config

```python
# app/core/llm_config.py

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from app.core.config import settings


def get_llm(model_id: str = "gpt-4o"):
    if model_id.startswith("gpt"):
        return ChatOpenAI(
            model=model_id,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
    elif model_id.startswith("claude"):
        return ChatAnthropic(
            model=model_id,
            api_key=settings.anthropic_api_key,
            temperature=0.7,
        )
    else:
        return ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )
```

## 11.2 Supabase Client

```python
# app/db/supabase_client.py

from supabase import create_client, Client
from app.core.config import settings

supabase_client: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key
)
```

## 11.3 Agent Factory

```python
# app/agents/__init__.py

from typing import Dict, Any
from crewai import Agent

from app.agents.strategic.planning.head_strategist import create_head_strategist
from app.agents.strategic.intelligence.trend_hunter import create_trend_hunter
from app.agents.strategic.intelligence.competitor_analyst import create_competitor_analyst
from app.agents.creative.copywriters.copy_instagram_expert import create_copy_instagram_expert
from app.agents.creative.copywriters.copy_linkedin_expert import create_copy_linkedin_expert
from app.agents.creative.copywriters.copy_youtube_expert import create_copy_youtube_expert
from app.agents.creative.copywriters.copy_ads_expert import create_copy_ads_expert
from app.agents.creative.persuasion.cta_specialist import create_cta_specialist
from app.agents.creative.persuasion.hook_specialist import create_hook_specialist
from app.agents.creative.design.graphic_designer_posts import create_graphic_designer_posts
from app.agents.creative.video.video_script_writer import create_video_script_writer
from app.agents.creative.video.reels_specialist import create_reels_specialist
from app.agents.distribution.organic.social_media_manager import create_social_media_manager
from app.agents.distribution.paid.traffic_manager import create_traffic_manager
from app.agents.distribution.paid.meta_ads_specialist import create_meta_ads_specialist
from app.agents.quality.review.brand_guardian import create_brand_guardian
from app.agents.quality.review.approval_manager import create_approval_manager
from app.agents.quality.personas.persona_skeptic import create_persona_skeptic
from app.agents.quality.personas.persona_enthusiast import create_persona_enthusiast
from app.agents.quality.personas.persona_busy_executive import create_persona_busy_executive


AGENT_CREATORS = {
    "head_strategist": create_head_strategist,
    "trend_hunter": create_trend_hunter,
    "competitor_analyst": create_competitor_analyst,
    "copy_instagram_expert": create_copy_instagram_expert,
    "copy_linkedin_expert": create_copy_linkedin_expert,
    "copy_youtube_expert": create_copy_youtube_expert,
    "copy_ads_expert": create_copy_ads_expert,
    "cta_specialist": create_cta_specialist,
    "hook_specialist": create_hook_specialist,
    "graphic_designer_posts": create_graphic_designer_posts,
    "video_script_writer": create_video_script_writer,
    "reels_specialist": create_reels_specialist,
    "social_media_manager": create_social_media_manager,
    "traffic_manager": create_traffic_manager,
    "meta_ads_specialist": create_meta_ads_specialist,
    "brand_guardian": create_brand_guardian,
    "approval_manager": create_approval_manager,
    "persona_skeptic": create_persona_skeptic,
    "persona_enthusiast": create_persona_enthusiast,
    "persona_busy_executive": create_persona_busy_executive,
}


class AgentFactory:
    async def create(self, agent_id: str, client_id: str, brand_context: str) -> Agent:
        if agent_id not in AGENT_CREATORS:
            raise ValueError(f"Agent not found: {agent_id}")
        
        creator = AGENT_CREATORS[agent_id]
        
        if agent_id.startswith("persona_"):
            return creator()
        
        return creator(client_id, brand_context)
```

---

# 12. PRÓXIMOS PASSOS

## Para implementar no Cursor:

1. **Cole este documento no Cursor (Cmd+I / Ctrl+I)**

2. **Peça para criar a estrutura:**
   ```
   Crie a estrutura de pastas conforme o blueprint
   ```

3. **Peça para implementar o MVP:**
   ```
   Implemente os agentes e crews marcados como [MVP]
   ```

4. **Configure o Supabase:**
   - Crie projeto no Supabase
   - Execute o SQL do pgvector
   - Configure variáveis de ambiente

5. **Teste:**
   ```bash
   pip install -r requirements.txt
   python main.py
   ```

6. **Primeiro teste:**
   ```bash
   curl -X POST http://localhost:8000/api/v1/create-campaign \
     -H "Content-Type: application/json" \
     -d '{"client_id": "test", "demand_type": "post_instagram", "theme": "Black Friday"}'
   ```

---

**FIM DO BLUEPRINT - PARTE 2**
