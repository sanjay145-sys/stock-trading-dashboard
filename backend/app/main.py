"""
StockPulse AI — FastAPI backend.

Startup sequence:
  1. Load the seed universe from screener.py
  2. Fetch real-time data for all tickers concurrently (yfinance)
  3. Run news ingestion + AI sentiment + AI recommendation per ticker
  4. Cache everything in-memory
  5. APScheduler repeats steps 2-4 every REFRESH_INTERVAL_MINUTES

API endpoints are thin read-through layers over the cache.
"""
from __future__ import annotations

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .ai_service import AIService, build_sentiment_aggregate
from .cache import stock_cache, rec_cache
from .config import settings
from .models import (
    AiRecommendation, CandleData, HealthResponse, NewsArticle,
    SentimentAggregate, Stock, StockFullData, TechnicalIndicators,
)
from .news_service import fetch_news_for_ticker
from .screener import SEED_UNIVERSE, compute_screen_score
from .stock_data import fetch_full_stock_data

logging.basicConfig(level=logging.INFO, format='%(asctime)s  %(levelname)s  %(name)s  %(message)s')
logger = logging.getLogger(__name__)

# ── Globals ───────────────────────────────────────────────────────────────────

ai = AIService(settings.anthropic_api_key)
executor = ThreadPoolExecutor(max_workers=12)
scheduler = AsyncIOScheduler(timezone='UTC')

# Limit concurrent Claude API calls to avoid 529 overload errors
_ai_semaphore = asyncio.Semaphore(4)

_last_refresh: Optional[datetime] = None
_next_refresh: Optional[datetime] = None

# Active ticker universe (starts as seed, screener may trim it)
active_tickers: list[str] = list(SEED_UNIVERSE[:settings.screener_top_n + 10])


# ── Core pipeline ─────────────────────────────────────────────────────────────

async def _fetch_stock_async(ticker: str):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, fetch_full_stock_data, ticker)


async def _process_ticker(ticker: str) -> Optional[StockFullData]:
    """Full pipeline for one ticker: data → news → sentiment → recommendation → cache."""
    try:
        snapshot, technicals, candles = await _fetch_stock_async(ticker)

        if not snapshot or not technicals:
            logger.debug(f'Skipping {ticker}: insufficient data')
            return None

        # News
        raw_articles = await fetch_news_for_ticker(ticker, snapshot['companyName'])

        # Sentiment analysis — rate-limited (semaphore) + fully async (AsyncAnthropic)
        scored_articles: list[dict] = []
        for art in raw_articles:
            async with _ai_semaphore:
                sent = await ai.analyze_sentiment(art['id'], art['headline'], art.get('summary', ''))
            scored_articles.append({**art, **sent, 'sentimentScore': sent.get('score', 0)})

        sentiment_agg = build_sentiment_aggregate(scored_articles)

        # AI Recommendation — also rate-limited + async
        tech_detail = technicals.model_dump()
        async with _ai_semaphore:
            rec_raw = await ai.generate_recommendation(
                ticker, snapshot, technicals.technicalScore, tech_detail, sentiment_agg
            )

        # Determine screener rank score (used for sorting the stock list)
        screen_score = compute_screen_score(snapshot, technicals.technicalScore, sentiment_agg['score'])

        # Build Pydantic models
        stock = Stock(
            ticker=ticker,
            companyName=snapshot['companyName'],
            sector=snapshot['sector'],
            price=snapshot['price'],
            change=snapshot['change'],
            changePercent=snapshot['changePercent'],
            marketCap=snapshot['marketCap'],
            exchange=snapshot['exchange'],
            beta=snapshot['beta'],
            pe=snapshot.get('pe'),
            volume=snapshot['volume'],
            week52High=snapshot['week52High'],
            week52Low=snapshot['week52Low'],
            recommendation=rec_raw['recommendation'],
            riskScore=rec_raw['risk_score'],
            rewardScore=rec_raw['reward_score'],
            confidence=rec_raw['confidence'],
        )

        def _norm_sentiment(s: str) -> str:
            if s in ('positive', 'neutral', 'negative'):
                return s
            s = s.lower()
            if 'pos' in s or s in ('good', 'bullish', 'up'):
                return 'positive'
            if 'neg' in s or s in ('bad', 'bearish', 'down'):
                return 'negative'
            return 'neutral'

        news_articles = [
            NewsArticle(
                id=a['id'],
                headline=a['headline'],
                source=a['source'],
                publishedAt=a['publishedAt'],
                sentiment=_norm_sentiment(a.get('sentiment', 'neutral')),
                sentimentScore=a.get('sentimentScore', 0),
                materiality=a.get('materiality', 'medium'),
                explanation=a.get('explanation', ''),
                keyTopics=a.get('key_topics', []),
            )
            for a in scored_articles
        ]

        ai_rec = AiRecommendation(
            recommendation=rec_raw['recommendation'],
            confidence=rec_raw['confidence'],
            riskScore=rec_raw['risk_score'],
            rewardScore=rec_raw['reward_score'],
            rationaleTechnical=rec_raw.get('rationale_technical', ''),
            rationaleSimple=rec_raw.get('rationale_simple', ''),
            keyRisks=rec_raw.get('key_risks', []),
            suggestedHorizon=rec_raw.get('suggested_horizon', '1-3 months'),
            priceTarget=rec_raw.get('price_target', snapshot['price']),
            updatedAt=datetime.now(timezone.utc).isoformat(),
        )

        full = StockFullData(
            stock=stock,
            indicators=technicals,
            aiRec=ai_rec,
            news=news_articles,
            candles=candles,
            sentimentAggregate=SentimentAggregate(**sentiment_agg),
        )

        stock_cache.set(ticker, {'data': full, 'screen_score': screen_score})
        logger.info(f'✓ {ticker}  {rec_raw["recommendation"]}  score={screen_score}')
        return full

    except Exception as exc:
        logger.error(f'Pipeline error for {ticker}: {exc}', exc_info=True)
        return None


async def refresh_all() -> None:
    """Full refresh cycle — runs every REFRESH_INTERVAL_MINUTES minutes."""
    global _last_refresh, _next_refresh, active_tickers

    universe = list(SEED_UNIVERSE) + settings.extra_ticker_list
    # Deduplicate while preserving order
    seen: set[str] = set()
    universe = [t for t in universe if not (t in seen or seen.add(t))]

    logger.info(f'=== Refresh cycle: {len(universe)} tickers ===')

    tasks = [_process_ticker(t) for t in universe]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Sort successful results by screener score descending
    scored = []
    for ticker in universe:
        entry = stock_cache.get(ticker)
        if entry:
            scored.append((ticker, entry['screen_score']))

    scored.sort(key=lambda x: x[1], reverse=True)
    active_tickers = [t for t, _ in scored[:settings.screener_top_n]]

    _last_refresh = datetime.now(timezone.utc)
    from apscheduler.triggers.interval import IntervalTrigger
    # Calculate next fire time
    next_dt = scheduler.get_jobs()[0].next_run_time if scheduler.get_jobs() else None
    _next_refresh = next_dt

    success = sum(1 for r in results if r and not isinstance(r, Exception))
    logger.info(f'=== Refresh complete: {success}/{len(universe)} OK  top={active_tickers[:5]} ===')


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info('StockPulse backend starting up…')
    logger.info(f'AI enabled: {settings.ai_enabled}  |  refresh every {settings.refresh_interval_minutes}m')

    # Initial data load (do NOT await the full refresh during startup — too slow)
    # Run it as a background task so the server becomes available immediately
    asyncio.create_task(refresh_all())

    scheduler.add_job(refresh_all, 'interval', minutes=settings.refresh_interval_minutes, id='refresh')
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)
    executor.shutdown(wait=False)
    logger.info('Backend shut down.')


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title='StockPulse AI',
    description='AI-powered stock investment dashboard backend',
    version='1.0.0',
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get('/api/health', response_model=HealthResponse)
async def health():
    now = datetime.now(timezone.utc)
    seconds_to_next = None
    if _next_refresh:
        diff = (_next_refresh - now).total_seconds()
        seconds_to_next = max(0, int(diff))

    return HealthResponse(
        status='ok',
        ai_enabled=settings.ai_enabled,
        tracked_stocks=len(active_tickers),
        last_refresh=_last_refresh.isoformat() if _last_refresh else None,
        next_refresh_in_seconds=seconds_to_next,
    )


@app.get('/api/stocks')
async def list_stocks() -> dict:
    """
    Returns the active (screener-selected) stocks with their full data,
    grouped by recommendation tier.
    """
    invest, watch, avoid = [], [], []
    stocks_map: dict[str, dict] = {}

    for ticker in active_tickers:
        entry = stock_cache.get(ticker)
        if not entry:
            continue
        full: StockFullData = entry['data']
        stocks_map[ticker] = full.model_dump()

        rec = full.stock.recommendation
        if rec == 'INVEST':
            invest.append(ticker)
        elif rec == 'WATCH':
            watch.append(ticker)
        else:
            avoid.append(ticker)

    return {
        'tickers': {
            'INVEST': invest,
            'WATCH': watch,
            'AVOID': avoid,
        },
        'stocks': stocks_map,
        'lastRefresh': _last_refresh.isoformat() if _last_refresh else None,
    }


@app.get('/api/stocks/{ticker}')
async def get_stock(ticker: str) -> dict:
    ticker = ticker.upper()
    entry = stock_cache.get(ticker)
    if not entry:
        raise HTTPException(status_code=404, detail=f'{ticker} not found or not yet loaded')
    full: StockFullData = entry['data']
    return full.model_dump()


@app.post('/api/refresh')
async def manual_refresh():
    """Trigger an immediate refresh cycle (useful for development)."""
    asyncio.create_task(refresh_all())
    return {'status': 'refresh started'}
