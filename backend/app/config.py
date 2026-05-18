from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    anthropic_api_key: str = ''
    refresh_interval_minutes: int = 5
    screener_top_n: int = 15
    frontend_url: str = 'http://localhost:3000'
    host: str = '0.0.0.0'
    port: int = 8000
    extra_tickers: str = ''

    @property
    def extra_ticker_list(self) -> list[str]:
        return [t.strip().upper() for t in self.extra_tickers.split(',') if t.strip()]

    @property
    def ai_enabled(self) -> bool:
        return bool(self.anthropic_api_key)


settings = Settings()
