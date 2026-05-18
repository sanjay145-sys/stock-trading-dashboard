export type Recommendation = 'INVEST' | 'WATCH' | 'AVOID';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type TrendSignal = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Materiality = 'high' | 'medium' | 'low';
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y';
export type Exchange = 'NYSE' | 'NASDAQ';

export interface Stock {
  ticker: string;
  companyName: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  exchange: Exchange;
  beta: number;
  pe: number | null;
  volume: string;
  week52High: number;
  week52Low: number;
  recommendation: Recommendation;
  riskScore: number;
  rewardScore: number;
  confidence: number;
}

export interface TechnicalIndicators {
  rsi14: number;
  macdValue: number;
  macdSignal: number;
  macdHistogram: number;
  bbUpper: number;
  bbLower: number;
  bbMiddle: number;
  bbPosition: 'UPPER' | 'MIDDLE' | 'LOWER';
  sma50: number;
  sma200: number;
  volumeRatio: number;
  technicalScore: number;
  trendSignal: TrendSignal;
  atr14: number;
}

export interface AiRecommendation {
  recommendation: Recommendation;
  confidence: number;
  riskScore: number;
  rewardScore: number;
  rationaleTechnical: string;
  rationaleSimple: string;
  keyRisks: string[];
  suggestedHorizon: string;
  priceTarget: number;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  sentiment: Sentiment;
  sentimentScore: number;
  materiality: Materiality;
  explanation: string;
  keyTopics: string[];
}

export interface SentimentAggregate {
  score: number;
  label: string;
  articleCount: number;
  breakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockFullData {
  stock: Stock;
  indicators: TechnicalIndicators;
  aiRec: AiRecommendation;
  news: NewsArticle[];
  candles: CandleData[];
  sentimentAggregate: SentimentAggregate;
}

export interface SectorData {
  name: string;
  ticker: string;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface MarketIndex {
  name: string;
  value: string;
  change: string;
  changePercent: string;
  direction: 'up' | 'down' | 'flat';
}
