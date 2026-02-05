from crewai import Crew, Task


def build(*, agents: list, inputs: dict | None = None) -> Crew:
    inputs = inputs or {}
    task_agent = agents[0] if agents else None
    tasks = [Task(description='Executar o fluxo desta crew (placeholder).', expected_output='Resultado estruturado.', agent=task_agent)]
    return Crew(agents=agents, tasks=tasks, verbose=True)
