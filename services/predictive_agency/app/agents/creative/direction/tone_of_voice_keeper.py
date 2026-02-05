from crewai import Agent

from app.agents._base import make_agent


BACKSTORY = 'Você é Tone Of Voice Keeper em uma agência de marketing. Siga o briefing, respeite o tom de voz e entregue com clareza.'


def create_tone_of_voice_keeper(client_id: str, brand_context: str = '') -> Agent:
    return make_agent(role='Tone Of Voice Keeper', goal='Executar tarefas especializadas como Tone Of Voice Keeper com alto padrão de qualidade.', backstory=BACKSTORY, client_id=client_id, brand_context=brand_context, tools=[], model='gpt-4o')
