import os

from app.core.config import settings


def get_llm(model: str) -> str:
    # CrewAI/litellm leem OPENAI_API_KEY via env.
    if settings.openai_api_key:
        os.environ.setdefault('OPENAI_API_KEY', settings.openai_api_key)
    return model
