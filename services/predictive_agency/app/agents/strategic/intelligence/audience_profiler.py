from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Audience Profiler em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_audience_profiler(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Audience Profiler', goal='Executar tarefas especializadas como Audience Profiler com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
