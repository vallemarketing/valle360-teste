class Tool:
    name: str = 'video_prompt_tool'
    description: str = 'video_prompt_tool (placeholder)'

    def __init__(self, **kwargs):
        self.kwargs = kwargs

    def run(self, query: str | None = None, **kwargs):
        return {'ok': True, 'tool': self.name, 'query': query, 'kwargs': kwargs}
