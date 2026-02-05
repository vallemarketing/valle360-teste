from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    supabase_url: str
    supabase_service_role_key: str

    openai_api_key: str | None = None
    openai_embedding_model: str = "text-embedding-3-small"

    # Optional: header auth between Next.js bridge (Vercel) and this service (Railway)
    bridge_secret: str | None = None

    port: int = 8000


settings = Settings()  # type: ignore

