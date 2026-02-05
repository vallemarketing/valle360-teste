class Tool:
    name: str = 'social_scheduler_tool'
    description: str = 'social_scheduler_tool (placeholder)'

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def run(self, query: str | None = None, **kwargs):
        return {'ok': True, 'tool': self.name, 'query': query, 'kwargs': kwargs}
