from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Copy Youtube Expert em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_copy_youtube_expert(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Copy Youtube Expert', goal='Executar tarefas especializadas como Copy Youtube Expert com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
