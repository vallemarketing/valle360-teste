from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Copy Tiktok Expert em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_copy_tiktok_expert(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Copy Tiktok Expert', goal='Executar tarefas especializadas como Copy Tiktok Expert com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
