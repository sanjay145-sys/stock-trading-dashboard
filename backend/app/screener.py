"""
Auto-discovery stock screener.
Scores a seed universe based on technical quality and market criteria,
then returns the top N candidates for tracking.
"""
from __future__ import annotations
import logging

logger = logging.getLogger(__name__)

# ── Seed universe ─────────────────────────────────────────────────────────────
# Broadly diversified across high-growth sectors.  Screener filters these down
# to the top N based on real-time data.

SEED_UNIVERSE: list[str] = [
    # Large-cap AI / tech
    'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AAPL',
    # Mid-cap tech / cloud
    'AMD', 'ORCL', 'PLTR', 'CRWD', 'PANW', 'SNOW', 'MDB', 'NET',
    'DDOG', 'TTD', 'FTNT', 'ZS', 'OKTA', 'HUBS', 'COIN',
    # Semiconductors
    'AVGO', 'QCOM', 'AMAT', 'MRVL', 'SMCI',
    # Healthcare / biotech
    'LLY', 'MRNA', 'ABBV', 'AMGN', 'GILD', 'VRTX', 'ISRG', 'DXCM',
    # Consumer discretionary
    'NFLX', 'TSLA', 'UBER', 'ABNB', 'BKNG', 'NKE',
    # Financials
    'JPM', 'V', 'MA', 'PYPL',
    # Energy / materials
    'XOM', 'CVX',
    # Industrials
    'CAT', 'DE', 'LMT', 'RTX',
    # High-risk / speculative (for AVOID tier)
    'RIVN', 'LCID', 'SNAP', 'BYND', 'PARA',
]


def compute_screen_score(
    snapshot: dict,
    tech_score: int,
    sentiment_score: float,
) -> float:
    """
    Composite screener score (0–100) used to rank stocks.
    Higher = more suitable for tracking (not necessarily INVEST).
    """
    score = 0.0

    # 1. Technical quality (40 pts)
    score += tech_score * 0.40

    # 2. Volume filter — penalise thinly traded stocks (20 pts)
    avg_vol = snapshot.get('avgVolume', 0)
    if avg_vol >= 5_000_000:
        score += 20
    elif avg_vol >= 1_000_000:
        score += 14
    elif avg_vol >= 500_000:
        score += 8
    else:
        score += 0

    # 3. Beta filter — prefer 0.8–2.2 for moderately aggressive (15 pts)
    beta = snapshot.get('beta', 1.0)
    if 0.8 <= beta <= 2.2:
        score += 15
    elif 0.5 <= beta < 0.8 or 2.2 < beta <= 3.0:
        score += 7

    # 4. Market cap — prefer mid-to-large cap (15 pts)
    mcap = snapshot.get('marketCapRaw', 0)
    if mcap >= 200e9:
        score += 15
    elif mcap >= 10e9:
        score += 12
    elif mcap >= 2e9:
        score += 8
    elif mcap >= 500e6:
        score += 4

    # 5. Sentiment bonus (10 pts)
    score += max(0.0, sentiment_score) * 10

    return round(score, 2)


def compute_risk_score(snapshot: dict, tech_score: int) -> int:
    """Rule-based risk score (0=safe, 100=very risky). Used as AI fallback."""
    risk = 50.0

    # Beta contribution
    beta = snapshot.get('beta', 1.0)
    risk += (beta - 1.0) * 15

    # Market cap: smaller = riskier
    mcap = snapshot.get('marketCapRaw', 0)
    if mcap < 2e9:
        risk += 20
    elif mcap < 10e9:
        risk += 10
    elif mcap > 200e9:
        risk -= 10

    # PE: N/A (no earnings) means high risk
    if snapshot.get('pe') is None:
        risk += 15

    # Technical score: low tech score = bearish = higher risk
    risk += (50 - tech_score) * 0.3

    return max(0, min(100, int(risk)))


def compute_reward_score(snapshot: dict, tech_score: int, sentiment_score: float) -> int:
    """Rule-based reward score (0=low, 100=high potential). Used as AI fallback."""
    reward = 40.0

    reward += tech_score * 0.35
    reward += sentiment_score * 20
    # Price below 52w high = more room to run
    price = snapshot.get('price', 0)
    high52 = snapshot.get('week52High', price)
    if high52 > 0:
        gap_pct = (high52 - price) / high52 * 100
        reward += min(gap_pct * 0.5, 15)

    return max(0, min(100, int(reward)))


def fallback_recommendation(risk: int, reward: int) -> tuple[str, int]:
    """Rule-based recommendation when Claude is unavailable."""
    if reward >= 70 and risk <= 65:
        return 'INVEST', 75
    if reward >= 55 and risk <= 75:
        return 'WATCH', 60
    return 'AVOID', 70
