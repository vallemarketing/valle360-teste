from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Meta Ads Specialist em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_meta_ads_specialist(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Meta Ads Specialist', goal='Executar tarefas especializadas como Meta Ads Specialist com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
