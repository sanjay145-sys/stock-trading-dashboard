"""
Simple in-memory TTL cache.  No Redis required for free-tier.
Thread-safe for use with APScheduler background jobs + FastAPI async handlers.
"""
from __future__ import annotations
import threading
import time
from typing import Any, Optional


class TTLCache:
    def __init__(self, default_ttl: int = 300):
        self._store: dict[str, tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self.default_ttl = default_ttl

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expires_at = time.monotonic() + (ttl or self.default_ttl)
        with self._lock:
            self._store[key] = (value, expires_at)

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()

    def keys(self) -> list[str]:
        now = time.monotonic()
        with self._lock:
            return [k for k, (_, exp) in self._store.items() if exp > now]


# Shared cache instances
stock_cache = TTLCache(default_ttl=360)        # stock data: 6-min TTL
news_cache = TTLCache(default_ttl=600)          # news: 10-min TTL
sentiment_cache = TTLCache(default_ttl=86400)   # sentiment: 24-hr TTL (immutable per article)
rec_cache = TTLCache(default_ttl=600)           # recommendations: 10-min TTL
