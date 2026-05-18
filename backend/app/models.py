from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel


Recommendation = Literal['INVEST', 'WATCH', 'AVOID']
Sentiment = Literal['positive', 'neutral', 'negative']
TrendSignal = Literal['BULLISH', 'BEARISH', 'NEUTRAL']
BBPosition = Literal['UPPER', 'MIDDLE', 'LOWER']


class Stock(BaseModel):
    ticker: str
    companyName: str
    sector: str
    price: float
    change: float
    changePercent: float
    marketCap: str
    exchange: str
    beta: float
    pe: Optional[float]
    volume: str
    week52High: float
    week52Low: float
    recommendation: Recommendation
    riskScore: int
    rewardScore: int
    confidence: int


class TechnicalIndicators(BaseModel):
    rsi14: float
    macdValue: float
    macdSignal: float
    macdHistogram: float
    bbUpper: float
    bbLower: float
    bbMiddle: float
    bbPosition: BBPosition
    sma50: float
    sma200: float
    volumeRatio: float
    technicalScore: int
    trendSignal: TrendSignal
    atr14: float


class AiRecommendation(BaseModel):
    recommendation: Recommendation
    confidence: int
    riskScore: int
    rewardScore: int
    rationaleTechnical: str
    rationaleSimple: str
    keyRisks: list[str]
    suggestedHorizon: str
    priceTarget: float
    updatedAt: str


class NewsArticle(BaseModel):
    id: str
    headline: str
    source: str
    publishedAt: str
    sentiment: Sentiment
    sentimentScore: float
    materiality: Literal['high', 'medium', 'low']
    explanation: str
    keyTopics: list[str]


class SentimentAggregate(BaseModel):
    score: float
    label: str
    articleCount: int
    breakdown: dict[str, int]


class CandleData(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockFullData(BaseModel):
    stock: Stock
    indicators: TechnicalIndicators
    aiRec: AiRecommendation
    news: list[NewsArticle]
    candles: list[CandleData]
    sentimentAggregate: SentimentAggregate


class HealthResponse(BaseModel):
    status: str
    ai_enabled: bool
    tracked_stocks: int
    last_refresh: Optional[str]
    next_refresh_in_seconds: Optional[int]
