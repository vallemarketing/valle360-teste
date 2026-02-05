from crewai import Agent

from app.core.llm_config import get_llm
from app.tools.memory.rag_brand_tool import RAGBrandTool


def make_agent(*, role: str, goal: str, backstory: str, client_id: str | None = None, brand_context: str | None = None, tools: list | None = None, model: str = 'gpt-4o') -> Agent:
    tools = tools or []
    if client_id:
        try:
            tools = [*tools, RAGBrandTool(client_id=client_id)]
        except Exception:
            pass
    if brand_context:
        backstory = f'{backstory}\n\nCONTEXTO DA MARCA:\n{brand_context}'
    return Agent(role=role, goal=goal, backstory=backstory, tools=tools, llm=get_llm(model), verbose=True, allow_delegation=True, max_iter=5)
