"""
Stock data fetching via yfinance + technical indicator computation via `ta`.
All yfinance calls are synchronous; run them in a ThreadPoolExecutor to avoid
blocking FastAPI's event loop.
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import ta
import yfinance as yf

from .models import CandleData, Stock, TechnicalIndicators

logger = logging.getLogger(__name__)


def _fmt_market_cap(value: float | None) -> str:
    if not value:
        return 'N/A'
    if value >= 1e12:
        return f'${value/1e12:.2f}T'
    if value >= 1e9:
        return f'${value/1e9:.1f}B'
    if value >= 1e6:
        return f'${value/1e6:.0f}M'
    return f'${value:,.0f}'


def _fmt_volume(value: float | None) -> str:
    if not value:
        return 'N/A'
    if value >= 1e9:
        return f'{value/1e9:.1f}B'
    if value >= 1e6:
        return f'{value/1e6:.1f}M'
    if value >= 1e3:
        return f'{value/1e3:.0f}K'
    return str(int(value))


def _safe(val, default=0.0):
    if val is None or (isinstance(val, float) and np.isnan(val)):
        return default
    return val


def fetch_stock_snapshot(ticker: str) -> dict | None:
    """Fetch price snapshot + basic info for one ticker. Returns None on failure."""
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        price = _safe(info.get('currentPrice') or info.get('regularMarketPrice'), 0.0)
        prev_close = _safe(info.get('previousClose') or info.get('regularMarketPreviousClose'), price)
        change = round(price - prev_close, 4)
        change_pct = round((change / prev_close * 100) if prev_close else 0.0, 4)

        return {
            'ticker': ticker,
            'companyName': info.get('longName') or info.get('shortName') or ticker,
            'sector': info.get('sector') or 'Unknown',
            'price': round(price, 2),
            'change': change,
            'changePercent': change_pct,
            'marketCap': _fmt_market_cap(info.get('marketCap')),
            'marketCapRaw': info.get('marketCap') or 0,
            'exchange': info.get('exchange') or 'NASDAQ',
            'beta': round(_safe(info.get('beta'), 1.0), 2),
            'pe': round(info.get('trailingPE'), 1) if info.get('trailingPE') else None,
            'volume': _fmt_volume(info.get('volume') or info.get('regularMarketVolume')),
            'volumeRaw': info.get('volume') or info.get('regularMarketVolume') or 0,
            'avgVolume': info.get('averageVolume') or 1,
            'week52High': round(_safe(info.get('fiftyTwoWeekHigh'), price * 1.3), 2),
            'week52Low': round(_safe(info.get('fiftyTwoWeekLow'), price * 0.7), 2),
        }
    except Exception as exc:
        logger.warning(f'snapshot failed for {ticker}: {exc}')
        return None


def compute_technicals(ticker: str, hist: pd.DataFrame) -> TechnicalIndicators | None:
    """Compute all technical indicators from a yfinance history DataFrame."""
    try:
        close = hist['Close'].squeeze()
        high = hist['High'].squeeze()
        low = hist['Low'].squeeze()
        volume = hist['Volume'].squeeze()

        if len(close) < 50:
            logger.warning(f'{ticker}: insufficient history ({len(close)} bars)')
            return None

        # RSI
        rsi_val = float(ta.momentum.RSIIndicator(close=close, window=14).rsi().iloc[-1])

        # MACD
        macd_obj = ta.trend.MACD(close=close)
        macd_val = float(macd_obj.macd().iloc[-1])
        macd_sig = float(macd_obj.macd_signal().iloc[-1])
        macd_hist = float(macd_obj.macd_diff().iloc[-1])

        # Bollinger Bands (20-period, 2 std)
        bb = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
        bb_upper = float(bb.bollinger_hband().iloc[-1])
        bb_lower = float(bb.bollinger_lband().iloc[-1])
        bb_mid = float(bb.bollinger_mavg().iloc[-1])
        current_price = float(close.iloc[-1])
        bb_range = bb_upper - bb_lower
        if bb_range > 0:
            bb_pct = (current_price - bb_lower) / bb_range
            bb_position = 'UPPER' if bb_pct > 0.7 else ('LOWER' if bb_pct < 0.3 else 'MIDDLE')
        else:
            bb_position = 'MIDDLE'

        # SMAs
        sma50_val = float(ta.trend.SMAIndicator(close=close, window=50).sma_indicator().iloc[-1])
        sma200_val = None
        if len(close) >= 200:
            sma200_val = float(ta.trend.SMAIndicator(close=close, window=200).sma_indicator().iloc[-1])
        else:
            sma200_val = float(close.iloc[:len(close)].mean())

        # ATR
        atr_val = float(
            ta.volatility.AverageTrueRange(high=high, low=low, close=close, window=14)
            .average_true_range()
            .iloc[-1]
        )

        # Volume ratio (current vs 20-day avg)
        avg_vol = float(volume.rolling(20).mean().iloc[-1])
        cur_vol = float(volume.iloc[-1])
        vol_ratio = round(cur_vol / avg_vol, 2) if avg_vol > 0 else 1.0

        # Trend signal
        is_golden = sma50_val > sma200_val if sma200_val else False
        if macd_hist > 0 and is_golden and 40 < rsi_val < 70:
            trend = 'BULLISH'
        elif macd_hist < 0 and not is_golden and rsi_val < 50:
            trend = 'BEARISH'
        else:
            trend = 'NEUTRAL'

        # Composite technical score (0-100)
        tech_score = _compute_tech_score(rsi_val, macd_hist, is_golden, vol_ratio, bb_pct if bb_range > 0 else 0.5)

        return TechnicalIndicators(
            rsi14=round(rsi_val, 1),
            macdValue=round(macd_val, 4),
            macdSignal=round(macd_sig, 4),
            macdHistogram=round(macd_hist, 4),
            bbUpper=round(bb_upper, 2),
            bbLower=round(bb_lower, 2),
            bbMiddle=round(bb_mid, 2),
            bbPosition=bb_position,
            sma50=round(sma50_val, 2),
            sma200=round(sma200_val, 2),
            volumeRatio=vol_ratio,
            technicalScore=tech_score,
            trendSignal=trend,
            atr14=round(atr_val, 2),
        )
    except Exception as exc:
        logger.warning(f'technicals failed for {ticker}: {exc}')
        return None


def _compute_tech_score(rsi: float, macd_hist: float, golden_cross: bool, vol_ratio: float, bb_pct: float) -> int:
    score = 0.0

    # RSI: ideal zone 45-65
    if 50 <= rsi <= 65:
        score += 30
    elif 45 <= rsi < 50 or 65 < rsi <= 70:
        score += 18
    elif 40 <= rsi < 45 or 70 < rsi <= 75:
        score += 8
    elif rsi < 30 or rsi > 80:
        score += 0

    # MACD histogram direction
    if macd_hist > 0:
        score += 25
    elif macd_hist < 0:
        score += 0
    else:
        score += 10

    # SMA golden cross
    score += 25 if golden_cross else 0

    # Volume
    if vol_ratio > 1.3:
        score += 15
    elif vol_ratio > 1.0:
        score += 8
    else:
        score += 0

    # BB position (not at extremes)
    if 0.4 <= bb_pct <= 0.75:
        score += 5

    return min(100, int(score))


def build_candles(hist: pd.DataFrame) -> list[CandleData]:
    """Convert yfinance history to list of CandleData for the frontend chart."""
    candles = []
    for date, row in hist.iterrows():
        try:
            day_str = date.strftime('%Y-%m-%d')
            candles.append(CandleData(
                time=day_str,
                open=round(float(row['Open']), 2),
                high=round(float(row['High']), 2),
                low=round(float(row['Low']), 2),
                close=round(float(row['Close']), 2),
                volume=int(row['Volume']),
            ))
        except Exception:
            continue
    return candles


def fetch_full_stock_data(ticker: str) -> tuple[dict | None, TechnicalIndicators | None, list[CandleData]]:
    """Fetch snapshot + history for one ticker. Returns (snapshot, technicals, candles)."""
    try:
        t = yf.Ticker(ticker)
        # 1 year of history for indicator accuracy
        hist = t.history(period='1y', auto_adjust=True)
        hist.index = pd.to_datetime(hist.index)

        if hist.empty or len(hist) < 20:
            return None, None, []

        snapshot = fetch_stock_snapshot(ticker)
        if not snapshot:
            return None, None, []

        technicals = compute_technicals(ticker, hist)
        candles = build_candles(hist.tail(120))  # last 120 trading days to frontend
        return snapshot, technicals, candles
    except Exception as exc:
        logger.warning(f'full_stock_data failed for {ticker}: {exc}')
        return None, None, []
