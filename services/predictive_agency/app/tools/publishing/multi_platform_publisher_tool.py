class Tool:
    name: str = 'multi_platform_publisher_tool'
    description: str = 'multi_platform_publisher_tool (placeholder)'

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def run(self, query: str | None = None, **kwargs):
        return {'ok': True, 'tool': self.name, 'query': query, 'kwargs': kwargs}
