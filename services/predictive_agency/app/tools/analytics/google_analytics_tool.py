class Tool:
    name: str = 'google_analytics_tool'
    description: str = 'google_analytics_tool (placeholder)'

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def run(self, query: str | None = None, **kwargs):
        return {'ok': True, 'tool': self.name, 'query': query, 'kwargs': kwargs}
