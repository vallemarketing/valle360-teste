from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Content Gap Finder em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_content_gap_finder(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Content Gap Finder', goal='Executar tarefas especializadas como Content Gap Finder com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
