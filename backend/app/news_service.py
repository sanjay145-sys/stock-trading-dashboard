"""
Free-tier news ingestion via RSS feeds.
Sources: Google News RSS + Yahoo Finance RSS (no API key required).
"""
from __future__ import annotations
import asyncio
import hashlib
import logging
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

import feedparser
import httpx

logger = logging.getLogger(__name__)

RSS_TIMEOUT = 8  # seconds per feed


def _content_hash(headline: str, source: str) -> str:
    return hashlib.sha256(f'{source}::{headline}'.encode()).hexdigest()[:16]


def _parse_date(date_str: str) -> str:
    """Parse RSS date string to ISO 8601 UTC string."""
    try:
        dt = parsedate_to_datetime(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()


def _rss_urls(ticker: str, company_name: str) -> list[str]:
    name_slug = company_name.split()[0]  # first word, avoids long queries
    return [
        # Yahoo Finance ticker-specific feed
        f'https://feeds.finance.yahoo.com/rss/2.0/headline?s={ticker}&region=US&lang=en-US',
        # Google News — company + "stock"
        f'https://news.google.com/rss/search?q={ticker}+stock+{name_slug}&hl=en-US&gl=US&ceid=US:en',
    ]


def _parse_feed_entries(feed: feedparser.FeedDict, ticker: str) -> list[dict]:
    articles = []
    source = feed.feed.get('title') or 'News'
    for entry in feed.entries[:6]:
        headline = entry.get('title', '').strip()
        if not headline or ticker.lower() not in headline.lower() and len(headline) < 10:
            # skip completely unrelated entries (Google News can be noisy)
            pass
        summary = entry.get('summary') or entry.get('description') or ''
        # Strip HTML tags from summary
        import re
        summary = re.sub(r'<[^>]+>', '', summary).strip()[:400]

        articles.append({
            'id': _content_hash(headline, source),
            'headline': headline,
            'source': source,
            'publishedAt': _parse_date(entry.get('published', '')),
            'url': entry.get('link', ''),
            'summary': summary,
        })
    return articles


async def fetch_news_for_ticker(ticker: str, company_name: str) -> list[dict]:
    """
    Fetch raw news articles for a single ticker from RSS feeds.
    Returns a list of dicts (not yet sentiment-scored).
    """
    urls = _rss_urls(ticker, company_name)
    all_articles: list[dict] = []
    seen_ids: set[str] = set()

    async with httpx.AsyncClient(timeout=RSS_TIMEOUT, follow_redirects=True) as client:
        tasks = [_fetch_single_rss(client, url, ticker) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            continue
        for article in result:
            if article['id'] not in seen_ids:
                seen_ids.add(article['id'])
                all_articles.append(article)

    # Sort by most recent first
    all_articles.sort(key=lambda a: a['publishedAt'], reverse=True)
    return all_articles[:8]  # cap at 8 articles per ticker


async def _fetch_single_rss(client: httpx.AsyncClient, url: str, ticker: str) -> list[dict]:
    try:
        resp = await client.get(url, headers={'User-Agent': 'StockPulse/1.0'})
        resp.raise_for_status()
        feed = feedparser.parse(resp.text)
        # Use company name placeholder since we only have ticker here
        return _parse_feed_entries(feed, ticker)
    except Exception as exc:
        logger.debug(f'RSS fetch failed {url}: {exc}')
        return []
