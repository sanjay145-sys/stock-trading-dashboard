"""
Claude API integration for:
  1. News sentiment analysis  (claude-haiku-4-5-20251001 — fast & cheap)
  2. Investment recommendations (claude-sonnet-4-6 — better reasoning)

Falls back to rule-based scoring when ANTHROPIC_API_KEY is not set.
Uses tool_use for structured JSON output (more reliable than parsing prose).
All Claude calls are fully async (AsyncAnthropic) to avoid blocking the event loop.
"""
from __future__ import annotations
import logging

import anthropic

from .cache import sentiment_cache, rec_cache
from .screener import compute_risk_score, compute_reward_score, fallback_recommendation

logger = logging.getLogger(__name__)

HAIKU = 'claude-haiku-4-5-20251001'
SONNET = 'claude-sonnet-4-6'

# ── Tool schemas ──────────────────────────────────────────────────────────────

_SENTIMENT_TOOL = {
    'name': 'record_sentiment',
    'description': 'Record the sentiment analysis result for a financial news article.',
    'input_schema': {
        'type': 'object',
        'properties': {
            'sentiment': {'type': 'string', 'enum': ['positive', 'neutral', 'negative']},
            'score': {'type': 'number', 'description': 'Float from -1.0 (very negative) to +1.0 (very positive)'},
            'materiality': {'type': 'string', 'enum': ['high', 'medium', 'low']},
            'explanation': {'type': 'string', 'description': 'One sentence plain-English explanation.'},
            'key_topics': {'type': 'array', 'items': {'type': 'string'}, 'description': '2-4 topic tags'},
        },
        'required': ['sentiment', 'score', 'materiality', 'explanation', 'key_topics'],
    },
}

_REC_TOOL = {
    'name': 'record_recommendation',
    'description': 'Record the investment recommendation for a stock.',
    'input_schema': {
        'type': 'object',
        'properties': {
            'recommendation': {'type': 'string', 'enum': ['INVEST', 'WATCH', 'AVOID']},
            'confidence': {'type': 'integer', 'description': '0-100'},
            'risk_score': {'type': 'integer', 'description': '0=safe, 100=very risky'},
            'reward_score': {'type': 'integer', 'description': '0=low upside, 100=high upside'},
            'rationale_technical': {'type': 'string'},
            'rationale_simple': {'type': 'string'},
            'key_risks': {'type': 'array', 'items': {'type': 'string'}},
            'suggested_horizon': {'type': 'string'},
            'price_target': {'type': 'number'},
        },
        'required': [
            'recommendation', 'confidence', 'risk_score', 'reward_score',
            'rationale_technical', 'rationale_simple', 'key_risks', 'suggested_horizon', 'price_target',
        ],
    },
}


def _norm_sentiment(s: str) -> str:
    if s in ('positive', 'neutral', 'negative'):
        return s
    s = s.lower()
    if 'pos' in s or s in ('good', 'bullish', 'up'):
        return 'positive'
    if 'neg' in s or s in ('bad', 'bearish', 'down'):
        return 'negative'
    return 'neutral'


class AIService:
    def __init__(self, api_key: str):
        self.enabled = bool(api_key)
        # Async client — non-blocking, does not hold a thread during API calls
        self._async_client = anthropic.AsyncAnthropic(api_key=api_key) if api_key else None

    # ── Sentiment analysis (async) ────────────────────────────────────────────

    async def analyze_sentiment(self, article_id: str, headline: str, summary: str) -> dict:
        """Async sentiment analysis. Cached by article_id for 24h."""
        cached = sentiment_cache.get(f'sent:{article_id}')
        if cached:
            return cached

        result = (
            await self._claude_sentiment_async(headline, summary)
            if self.enabled
            else self._rule_sentiment(headline)
        )
        sentiment_cache.set(f'sent:{article_id}', result, ttl=86400)
        return result

    async def _claude_sentiment_async(self, headline: str, summary: str) -> dict:
        try:
            resp = await self._async_client.messages.create(
                model=HAIKU,
                max_tokens=512,
                tools=[_SENTIMENT_TOOL],
                tool_choice={'type': 'any'},
                messages=[{
                    'role': 'user',
                    'content': (
                        f'Analyze the sentiment of this financial news for stock investors.\n\n'
                        f'Headline: {headline}\n'
                        f'Summary: {summary[:600]}'
                    ),
                }],
            )
            for block in resp.content:
                if block.type == 'tool_use' and block.name == 'record_sentiment':
                    result = dict(block.input)
                    result['sentiment'] = _norm_sentiment(result.get('sentiment', 'neutral'))
                    return result
        except Exception as exc:
            logger.warning(f'Claude sentiment error: {exc}')

        return self._rule_sentiment(headline)

    @staticmethod
    def _rule_sentiment(headline: str) -> dict:
        text = headline.lower()
        pos = ['beat', 'record', 'surge', 'gain', 'rise', 'growth', 'profit', 'win', 'expand', 'strong', 'upgrade']
        neg = ['miss', 'fall', 'drop', 'loss', 'decline', 'cut', 'lawsuit', 'fine', 'delay', 'weak', 'downgrade']
        p = sum(1 for w in pos if w in text)
        n = sum(1 for w in neg if w in text)
        if p > n:
            return {'sentiment': 'positive', 'score': 0.5, 'materiality': 'medium',
                    'explanation': 'Positive signals in headline.', 'key_topics': ['news']}
        if n > p:
            return {'sentiment': 'negative', 'score': -0.4, 'materiality': 'medium',
                    'explanation': 'Negative signals in headline.', 'key_topics': ['news']}
        return {'sentiment': 'neutral', 'score': 0.0, 'materiality': 'low',
                'explanation': 'No strong signals detected.', 'key_topics': ['news']}

    # ── Investment recommendation (async) ─────────────────────────────────────

    async def generate_recommendation(
        self, ticker: str, snapshot: dict, tech_score: int, tech_detail: dict, sentiment_agg: dict,
    ) -> dict:
        cached = rec_cache.get(f'rec:{ticker}')
        if cached:
            return cached

        result = (
            await self._claude_rec_async(ticker, snapshot, tech_score, tech_detail, sentiment_agg)
            if self.enabled
            else self._rule_recommendation(ticker, snapshot, tech_score, sentiment_agg)
        )
        rec_cache.set(f'rec:{ticker}', result, ttl=600)
        return result

    async def _claude_rec_async(
        self, ticker: str, snapshot: dict, tech_score: int, tech_detail: dict, sentiment_agg: dict
    ) -> dict:
        prompt = f"""You are an AI investment analyst for intermediate investors with a moderately aggressive risk profile.
Analyze this stock and produce an investment recommendation.

Ticker: {ticker} ({snapshot.get('companyName', ticker)})
Sector: {snapshot.get('sector', 'Unknown')}
Price: ${snapshot.get('price', 0):.2f}  |  Market Cap: {snapshot.get('marketCap', 'N/A')}
Beta: {snapshot.get('beta', 1.0)}  |  P/E: {snapshot.get('pe') or 'N/A (no earnings)'}
52w: ${snapshot.get('week52Low', 0):.2f} – ${snapshot.get('week52High', 0):.2f}

Technical:
- RSI (14): {tech_detail.get('rsi14', 'N/A')}
- MACD Histogram: {tech_detail.get('macdHistogram', 'N/A')} ({'bullish' if (tech_detail.get('macdHistogram') or 0) > 0 else 'bearish'})
- BB Position: {tech_detail.get('bbPosition', 'N/A')}
- SMA50 vs SMA200: {'Golden Cross ✓' if (tech_detail.get('sma50') or 0) > (tech_detail.get('sma200') or 0) else 'Death Cross ✗'}
- Volume Ratio: {tech_detail.get('volumeRatio', 1.0)}x  |  ATR: ${tech_detail.get('atr14', 0):.2f}
- Technical Score: {tech_score}/100

News (72h): score={sentiment_agg.get('score', 0):.2f} ({sentiment_agg.get('label', 'Neutral')}) | {sentiment_agg.get('articleCount', 0)} articles | +{sentiment_agg.get('breakdown', {}).get('positive', 0)} ={sentiment_agg.get('breakdown', {}).get('neutral', 0)} -{sentiment_agg.get('breakdown', {}).get('negative', 0)}

Investor: intermediate, moderately aggressive, 1-3 month horizon, seeks medium-risk high-reward."""

        try:
            resp = await self._async_client.messages.create(
                model=SONNET,
                max_tokens=1024,
                tools=[_REC_TOOL],
                tool_choice={'type': 'any'},
                messages=[{'role': 'user', 'content': prompt}],
            )
            for block in resp.content:
                if block.type == 'tool_use' and block.name == 'record_recommendation':
                    return block.input
        except Exception as exc:
            logger.warning(f'Claude recommendation error for {ticker}: {exc}')

        return self._rule_recommendation(ticker, snapshot, tech_score, sentiment_agg)

    @staticmethod
    def _rule_recommendation(ticker: str, snapshot: dict, tech_score: int, sentiment_agg: dict) -> dict:
        risk = compute_risk_score(snapshot, tech_score)
        reward = compute_reward_score(snapshot, tech_score, sentiment_agg.get('score', 0))
        rec, conf = fallback_recommendation(risk, reward)
        price = snapshot.get('price', 0)
        target = price * (1.12 if rec == 'INVEST' else 1.06 if rec == 'WATCH' else 0.92)
        return {
            'recommendation': rec,
            'confidence': conf,
            'risk_score': risk,
            'reward_score': reward,
            'rationale_technical': f'Rule-based: tech score {tech_score}/100.',
            'rationale_simple': f'Rated {rec} based on technical indicators and news sentiment.',
            'key_risks': ['Set ANTHROPIC_API_KEY for AI-powered analysis.'],
            'suggested_horizon': '1-3 months',
            'price_target': round(target, 2),
        }


def build_sentiment_aggregate(articles_with_sentiment: list[dict]) -> dict:
    if not articles_with_sentiment:
        return {'score': 0.0, 'label': 'No Data', 'articleCount': 0,
                'breakdown': {'positive': 0, 'neutral': 0, 'negative': 0}}

    scores = [a.get('sentimentScore', 0.0) for a in articles_with_sentiment]
    avg = sum(scores) / len(scores)

    pos = sum(1 for a in articles_with_sentiment if a.get('sentiment') == 'positive')
    neu = sum(1 for a in articles_with_sentiment if a.get('sentiment') == 'neutral')
    neg = sum(1 for a in articles_with_sentiment if a.get('sentiment') == 'negative')

    label = ('Strongly Positive' if avg >= 0.5 else 'Positive' if avg >= 0.2
             else 'Neutral' if avg >= -0.2 else 'Negative' if avg >= -0.5
             else 'Strongly Negative')

    return {
        'score': round(avg, 2),
        'label': label,
        'articleCount': len(articles_with_sentiment),
        'breakdown': {'positive': pos, 'neutral': neu, 'negative': neg},
    }
