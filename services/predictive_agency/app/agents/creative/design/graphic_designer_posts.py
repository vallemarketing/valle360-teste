from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Graphic Designer Posts em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_graphic_designer_posts(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Graphic Designer Posts', goal='Executar tarefas especializadas como Graphic Designer Posts com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
