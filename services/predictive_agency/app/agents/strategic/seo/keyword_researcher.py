from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Keyword Researcher em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_keyword_researcher(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Keyword Researcher', goal='Executar tarefas especializadas como Keyword Researcher com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
