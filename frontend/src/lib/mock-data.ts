import type {
  StockFullData,
  CandleData,
  NewsArticle,
  SectorData,
  MarketIndex,
  Stock,
} from '@/types';

function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function genCandles(ticker: string, basePrice: number, days = 120): CandleData[] {
  const seed = ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = createRng(seed);
  const candles: CandleData[] = [];

  let price = basePrice * (0.72 + rng() * 0.18);
  const endDate = new Date(2026, 4, 16); // 2026-05-16

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const momentum = (basePrice - price) / basePrice;
    const bias = 0.47 - momentum * 0.3;
    const change = (rng() - bias) * price * 0.028;

    const open = parseFloat(price.toFixed(2));
    const close = parseFloat((price + change).toFixed(2));
    const high = parseFloat((Math.max(open, close) * (1 + rng() * 0.008)).toFixed(2));
    const low = parseFloat((Math.min(open, close) * (1 - rng() * 0.008)).toFixed(2));
    const volume = Math.floor(400000 + rng() * 3500000);

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    candles.push({ time: `${y}-${m}-${d}`, open, high, low, close, volume });
    price = close;
  }

  return candles;
}

const makeNews = (id: string, ticker: string, items: Omit<NewsArticle, 'id'>[]): NewsArticle[] =>
  items.map((n, i) => ({ ...n, id: `${ticker}-${id}-${i}` }));

// ─── INVEST STOCKS ──────────────────────────────────────────────────────────

const nvdaData: StockFullData = {
  stock: {
    ticker: 'NVDA', companyName: 'NVIDIA Corporation', sector: 'Technology',
    price: 892.40, change: 20.14, changePercent: 2.31, marketCap: '$2.19T',
    exchange: 'NASDAQ', beta: 1.72, pe: 68.4, volume: '41.2M',
    week52High: 974.00, week52Low: 475.09,
    recommendation: 'INVEST', riskScore: 62, rewardScore: 91, confidence: 87,
  },
  indicators: {
    rsi14: 65.4, macdValue: 8.92, macdSignal: 6.21, macdHistogram: 2.71,
    bbUpper: 918.40, bbLower: 831.20, bbMiddle: 874.80, bbPosition: 'UPPER',
    sma50: 849.60, sma200: 712.30, volumeRatio: 1.34, technicalScore: 82,
    trendSignal: 'BULLISH', atr14: 24.8,
  },
  aiRec: {
    recommendation: 'INVEST', confidence: 87, riskScore: 62, rewardScore: 91,
    rationaleTechnical: 'RSI at 65.4 shows strong momentum without entering overbought territory. MACD histogram expanding positively confirms bullish momentum. Price trading above both SMA50 ($849) and SMA200 ($712) — a confirmed golden cross. Volume 34% above 20-day average signals institutional accumulation.',
    rationaleSimple: 'NVIDIA is the dominant force in AI chips. Strong earnings growth, rising demand from data centers, and bullish price momentum make this a compelling near-term opportunity. Risk is moderate given the premium valuation, but reward potential is exceptional.',
    keyRisks: [
      'Elevated P/E of 68x — vulnerable to multiple compression',
      'China export restrictions could reduce addressable market',
      'AMD MI350 gaining traction in enterprise AI workloads',
    ],
    suggestedHorizon: '1–3 months',
    priceTarget: 980.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'NVDA', [
    {
      headline: 'NVIDIA Reports Record $26B Revenue — AI Data Center Demand Defies Expectations',
      source: 'Reuters', publishedAt: '2026-05-17T10:30:00Z',
      sentiment: 'positive', sentimentScore: 0.92, materiality: 'high',
      explanation: 'Record quarterly revenue driven by Blackwell GPU shipments to hyperscalers.',
      keyTopics: ['earnings', 'data center', 'Blackwell', 'AI'],
    },
    {
      headline: 'Jensen Huang: Next-Gen Rubin Architecture on Track for 2027 Launch',
      source: 'Bloomberg', publishedAt: '2026-05-16T15:22:00Z',
      sentiment: 'positive', sentimentScore: 0.74, materiality: 'medium',
      explanation: 'CEO confirms product roadmap continuity, reinforcing long-term competitive moat.',
      keyTopics: ['product roadmap', 'Rubin GPU', 'CEO'],
    },
    {
      headline: 'AMD MI350 Gains Enterprise Traction — Challenges NVIDIA\'s Data Center Dominance',
      source: 'CNBC', publishedAt: '2026-05-15T11:00:00Z',
      sentiment: 'negative', sentimentScore: -0.38, materiality: 'medium',
      explanation: 'Emerging competition could limit NVIDIA\'s pricing power in enterprise AI.',
      keyTopics: ['competition', 'AMD', 'market share'],
    },
    {
      headline: 'US Commerce Dept Clarifies Export Rules — NVIDIA\'s H200 Approved for Gulf Region',
      source: 'WSJ', publishedAt: '2026-05-14T09:15:00Z',
      sentiment: 'positive', sentimentScore: 0.65, materiality: 'high',
      explanation: 'Export clarity removes a key regulatory overhang for international sales.',
      keyTopics: ['export controls', 'regulation', 'Middle East'],
    },
  ]),
  sentimentAggregate: {
    score: 0.73, label: 'Strongly Positive', articleCount: 14,
    breakdown: { positive: 10, neutral: 3, negative: 1 },
  },
  candles: genCandles('NVDA', 892.40),
};

const amznData: StockFullData = {
  stock: {
    ticker: 'AMZN', companyName: 'Amazon.com Inc', sector: 'Consumer Discretionary',
    price: 187.50, change: 3.32, changePercent: 1.80, marketCap: '$1.96T',
    exchange: 'NASDAQ', beta: 1.15, pe: 42.1, volume: '38.4M',
    week52High: 215.90, week52Low: 151.61,
    recommendation: 'INVEST', riskScore: 48, rewardScore: 82, confidence: 84,
  },
  indicators: {
    rsi14: 58.2, macdValue: 1.84, macdSignal: 1.12, macdHistogram: 0.72,
    bbUpper: 196.40, bbLower: 172.80, bbMiddle: 184.60, bbPosition: 'MIDDLE',
    sma50: 180.20, sma200: 172.40, volumeRatio: 1.18, technicalScore: 74,
    trendSignal: 'BULLISH', atr14: 5.6,
  },
  aiRec: {
    recommendation: 'INVEST', confidence: 84, riskScore: 48, rewardScore: 82,
    rationaleTechnical: 'RSI at 58 is healthy momentum without overextension. Positive MACD crossover 2 weeks ago with expanding histogram. Price holds above both moving averages. Volume slightly elevated suggests moderate institutional interest.',
    rationaleSimple: 'Amazon AWS continues to grow at 35%+ driven by AI workloads. Retail margins are improving and advertising revenue is surging. Lower risk profile than pure-play AI stocks with solid fundamentals.',
    keyRisks: [
      'Antitrust scrutiny in EU marketplace practices',
      'High capital expenditure for AI infrastructure build-out',
      'Consumer spending slowdown could weigh on retail margins',
    ],
    suggestedHorizon: '1–3 months',
    priceTarget: 215.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'AMZN', [
    {
      headline: 'Amazon AWS Revenue Surges 35% — Enterprise AI Adoption Accelerates',
      source: 'Bloomberg', publishedAt: '2026-05-16T14:00:00Z',
      sentiment: 'positive', sentimentScore: 0.87, materiality: 'high',
      explanation: 'Cloud segment continues to outpace expectations driven by AI workloads.',
      keyTopics: ['AWS', 'cloud', 'AI', 'earnings'],
    },
    {
      headline: 'Amazon Expands Same-Day Delivery to 50 New US Markets',
      source: 'Reuters', publishedAt: '2026-05-15T10:30:00Z',
      sentiment: 'positive', sentimentScore: 0.58, materiality: 'medium',
      explanation: 'Logistics expansion strengthens competitive moat against Walmart and Target.',
      keyTopics: ['logistics', 'retail', 'expansion'],
    },
    {
      headline: 'EU Antitrust Regulators Open Formal Investigation into Amazon Marketplace',
      source: 'FT', publishedAt: '2026-05-13T08:45:00Z',
      sentiment: 'negative', sentimentScore: -0.42, materiality: 'medium',
      explanation: 'Regulatory probe could result in fines and forced operational changes in Europe.',
      keyTopics: ['antitrust', 'EU', 'regulation', 'marketplace'],
    },
  ]),
  sentimentAggregate: {
    score: 0.61, label: 'Positive', articleCount: 11,
    breakdown: { positive: 8, neutral: 2, negative: 1 },
  },
  candles: genCandles('AMZN', 187.50),
};

const metaData: StockFullData = {
  stock: {
    ticker: 'META', companyName: 'Meta Platforms Inc', sector: 'Communication Services',
    price: 512.30, change: 10.52, changePercent: 2.10, marketCap: '$1.30T',
    exchange: 'NASDAQ', beta: 1.28, pe: 28.6, volume: '19.8M',
    week52High: 598.95, week52Low: 391.35,
    recommendation: 'INVEST', riskScore: 55, rewardScore: 85, confidence: 82,
  },
  indicators: {
    rsi14: 62.8, macdValue: 6.40, macdSignal: 4.82, macdHistogram: 1.58,
    bbUpper: 532.00, bbLower: 481.60, bbMiddle: 506.80, bbPosition: 'UPPER',
    sma50: 491.20, sma200: 448.60, volumeRatio: 1.22, technicalScore: 79,
    trendSignal: 'BULLISH', atr14: 14.2,
  },
  aiRec: {
    recommendation: 'INVEST', confidence: 82, riskScore: 55, rewardScore: 85,
    rationaleTechnical: 'Bullish MACD crossover with RSI at 62.8 showing strong momentum. Trading in upper Bollinger Band zone with consistent volume support. SMA50 > SMA200 confirms established uptrend.',
    rationaleSimple: 'Meta\'s AI-powered ad targeting and Llama model ecosystem are driving user engagement and revenue. At a 28x P/E, it\'s reasonably valued for its growth rate. Threads growth adds optionality.',
    keyRisks: [
      'Privacy regulatory fines accumulating globally',
      'Teen usage declining in key Western markets',
      'Heavy AI infrastructure investment compressing near-term margins',
    ],
    suggestedHorizon: '1–3 months',
    priceTarget: 575.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'META', [
    {
      headline: 'Meta\'s AI Personalization Boosts Daily Active Users by 22% Year-Over-Year',
      source: 'Bloomberg', publishedAt: '2026-05-17T09:15:00Z',
      sentiment: 'positive', sentimentScore: 0.88, materiality: 'high',
      explanation: 'AI-driven feed personalization is reversing user engagement decline.',
      keyTopics: ['AI', 'user growth', 'engagement', 'DAU'],
    },
    {
      headline: 'Threads Reaches 180M Monthly Active Users, Monetization Begins Q3',
      source: 'CNBC', publishedAt: '2026-05-15T12:00:00Z',
      sentiment: 'positive', sentimentScore: 0.70, materiality: 'medium',
      explanation: 'Threads monetization timeline provides new revenue stream entering 2027.',
      keyTopics: ['Threads', 'social media', 'monetization'],
    },
    {
      headline: 'Meta Faces $1.3B Privacy Fine from EU Data Regulator — Largest Ever',
      source: 'Reuters', publishedAt: '2026-05-14T07:30:00Z',
      sentiment: 'negative', sentimentScore: -0.55, materiality: 'high',
      explanation: 'Record EU fine highlights ongoing regulatory headwinds for Meta\'s data practices.',
      keyTopics: ['GDPR', 'privacy', 'EU', 'fine', 'regulation'],
    },
  ]),
  sentimentAggregate: {
    score: 0.58, label: 'Positive', articleCount: 9,
    breakdown: { positive: 6, neutral: 2, negative: 1 },
  },
  candles: genCandles('META', 512.30),
};

const googlData: StockFullData = {
  stock: {
    ticker: 'GOOGL', companyName: 'Alphabet Inc', sector: 'Communication Services',
    price: 175.80, change: 2.44, changePercent: 1.41, marketCap: '$2.18T',
    exchange: 'NASDAQ', beta: 1.06, pe: 24.8, volume: '24.6M',
    week52High: 207.05, week52Low: 149.78,
    recommendation: 'INVEST', riskScore: 44, rewardScore: 78, confidence: 79,
  },
  indicators: {
    rsi14: 54.6, macdValue: 1.42, macdSignal: 0.88, macdHistogram: 0.54,
    bbUpper: 183.20, bbLower: 163.40, bbMiddle: 173.30, bbPosition: 'MIDDLE',
    sma50: 169.80, sma200: 163.20, volumeRatio: 1.08, technicalScore: 68,
    trendSignal: 'BULLISH', atr14: 5.2,
  },
  aiRec: {
    recommendation: 'INVEST', confidence: 79, riskScore: 44, rewardScore: 78,
    rationaleTechnical: 'Moderate bullish momentum with RSI at 54.6. MACD positive but histogram not yet expanding strongly. Price comfortably above both moving averages. Lower beta makes this a more stable AI play.',
    rationaleSimple: 'Alphabet is the safest way to play AI at a reasonable P/E. Google Search remains dominant, YouTube advertising is growing, and Google Cloud is gaining share. Strong balance sheet with $100B+ in cash.',
    keyRisks: [
      'DOJ antitrust case threatens Search monopoly',
      'OpenAI and Perplexity eroding Search market share',
      'Cloud trailing AWS and Azure in market share',
    ],
    suggestedHorizon: '2–4 months',
    priceTarget: 205.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'GOOGL', [
    {
      headline: 'Google Gemini Ultra Outperforms GPT-5 on Key AI Benchmarks',
      source: 'TechCrunch', publishedAt: '2026-05-16T16:00:00Z',
      sentiment: 'positive', sentimentScore: 0.81, materiality: 'high',
      explanation: 'Gemini benchmark wins reinforce Alphabet\'s AI competitiveness narrative.',
      keyTopics: ['AI', 'Gemini', 'benchmark', 'competition'],
    },
    {
      headline: 'DOJ Antitrust Case Against Google Enters Final Arguments Phase',
      source: 'WSJ', publishedAt: '2026-05-15T08:30:00Z',
      sentiment: 'negative', sentimentScore: -0.48, materiality: 'high',
      explanation: 'Antitrust outcome could force restructuring of the lucrative Search default agreements.',
      keyTopics: ['antitrust', 'DOJ', 'legal', 'Search'],
    },
    {
      headline: 'Google Cloud Revenue Hits $12B Quarterly — Gains Share from Azure',
      source: 'Bloomberg', publishedAt: '2026-05-14T13:20:00Z',
      sentiment: 'positive', sentimentScore: 0.76, materiality: 'high',
      explanation: 'Cloud segment acceleration shows diversification of revenue beyond Search.',
      keyTopics: ['Google Cloud', 'revenue', 'cloud computing'],
    },
  ]),
  sentimentAggregate: {
    score: 0.48, label: 'Positive', articleCount: 12,
    breakdown: { positive: 7, neutral: 3, negative: 2 },
  },
  candles: genCandles('GOOGL', 175.80),
};

const msftData: StockFullData = {
  stock: {
    ticker: 'MSFT', companyName: 'Microsoft Corporation', sector: 'Technology',
    price: 415.20, change: 3.71, changePercent: 0.90, marketCap: '$3.08T',
    exchange: 'NASDAQ', beta: 0.92, pe: 36.2, volume: '22.1M',
    week52High: 468.35, week52Low: 360.20,
    recommendation: 'INVEST', riskScore: 40, rewardScore: 75, confidence: 81,
  },
  indicators: {
    rsi14: 56.1, macdValue: 2.18, macdSignal: 1.64, macdHistogram: 0.54,
    bbUpper: 430.40, bbLower: 394.20, bbMiddle: 412.30, bbPosition: 'MIDDLE',
    sma50: 404.80, sma200: 392.10, volumeRatio: 0.98, technicalScore: 71,
    trendSignal: 'BULLISH', atr14: 9.8,
  },
  aiRec: {
    recommendation: 'INVEST', confidence: 81, riskScore: 40, rewardScore: 75,
    rationaleTechnical: 'Steady uptrend with RSI in healthy zone. MACD positive and holding above signal line. Price approaching upper Bollinger Band — watch for short-term resistance. Low beta means less downside in market pullbacks.',
    rationaleSimple: 'Microsoft is the most balanced AI investment. Copilot integration across Office 365 drives direct revenue. Azure AI services growing 60%+ and OpenAI partnership provides competitive differentiation. Lowest risk score among INVEST tier.',
    keyRisks: [
      'Copilot adoption slower than projected by enterprise customers',
      'Activist investor pressure on AI spending pace',
      'Competition from Google Workspace in enterprise market',
    ],
    suggestedHorizon: '1–3 months',
    priceTarget: 460.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'MSFT', [
    {
      headline: 'Microsoft Copilot Crosses 10M Daily Active Enterprise Users — Revenue Inflection Ahead',
      source: 'Bloomberg', publishedAt: '2026-05-17T08:00:00Z',
      sentiment: 'positive', sentimentScore: 0.84, materiality: 'high',
      explanation: 'Copilot adoption milestone signals the AI monetization story is becoming real.',
      keyTopics: ['Copilot', 'AI', 'enterprise', 'SaaS'],
    },
    {
      headline: 'Azure AI Services Revenue Grows 61% — Outpacing AWS and Google Cloud',
      source: 'CNBC', publishedAt: '2026-05-16T11:45:00Z',
      sentiment: 'positive', sentimentScore: 0.79, materiality: 'high',
      explanation: 'Azure AI leadership position translating into measurable revenue acceleration.',
      keyTopics: ['Azure', 'cloud', 'AI services', 'revenue'],
    },
    {
      headline: 'EU Regulators Review Microsoft\'s OpenAI Investment — Antitrust Concerns Raised',
      source: 'FT', publishedAt: '2026-05-13T09:00:00Z',
      sentiment: 'negative', sentimentScore: -0.35, materiality: 'medium',
      explanation: 'EU probe adds regulatory uncertainty to Microsoft\'s AI strategy.',
      keyTopics: ['OpenAI', 'antitrust', 'EU', 'investment'],
    },
  ]),
  sentimentAggregate: {
    score: 0.64, label: 'Positive', articleCount: 10,
    breakdown: { positive: 7, neutral: 2, negative: 1 },
  },
  candles: genCandles('MSFT', 415.20),
};

// ─── WATCH STOCKS ───────────────────────────────────────────────────────────

const tslaData: StockFullData = {
  stock: {
    ticker: 'TSLA', companyName: 'Tesla Inc', sector: 'Consumer Discretionary',
    price: 177.40, change: -1.42, changePercent: -0.79, marketCap: '$567B',
    exchange: 'NASDAQ', beta: 2.01, pe: 58.3, volume: '89.4M',
    week52High: 278.98, week52Low: 138.80,
    recommendation: 'WATCH', riskScore: 72, rewardScore: 71, confidence: 61,
  },
  indicators: {
    rsi14: 52.1, macdValue: -0.42, macdSignal: -0.18, macdHistogram: -0.24,
    bbUpper: 191.80, bbLower: 158.40, bbMiddle: 175.10, bbPosition: 'MIDDLE',
    sma50: 172.40, sma200: 189.60, volumeRatio: 1.42, technicalScore: 48,
    trendSignal: 'NEUTRAL', atr14: 11.8,
  },
  aiRec: {
    recommendation: 'WATCH', confidence: 61, riskScore: 72, rewardScore: 71,
    rationaleTechnical: 'Mixed signals: RSI neutral but MACD slightly bearish. Price below SMA200 ($189) is a concern — needs recapture to confirm new uptrend. Very high beta and volume spikes suggest speculative activity.',
    rationaleSimple: 'Tesla is in a wait-and-see phase. The Cybercab launch and Full Self-Driving progress are catalysts to watch. High risk due to CEO distraction and EV demand softness. Worth monitoring for a technical breakout above $195.',
    keyRisks: [
      'Elon Musk divided attention between Tesla, SpaceX, and DOGE',
      'EV demand softening — aggressive price cuts compressing margins',
      'Traditional automakers closing the EV technology gap',
      'Cybercab launch delays could disappoint investors',
    ],
    suggestedHorizon: '2–6 weeks (watch for breakout)',
    priceTarget: 210.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'TSLA', [
    {
      headline: 'Tesla Cybercab Production Trial Begins at Gigafactory Texas — Q4 Launch Confirmed',
      source: 'Reuters', publishedAt: '2026-05-16T13:00:00Z',
      sentiment: 'positive', sentimentScore: 0.72, materiality: 'high',
      explanation: 'Cybercab production milestone is a key catalyst for Tesla\'s autonomous vehicle story.',
      keyTopics: ['Cybercab', 'autonomous', 'production', 'Gigafactory'],
    },
    {
      headline: 'Tesla Q1 Deliveries Miss Estimates — Global EV Demand Remains Soft',
      source: 'Bloomberg', publishedAt: '2026-05-14T09:30:00Z',
      sentiment: 'negative', sentimentScore: -0.58, materiality: 'high',
      explanation: 'Delivery miss reflects ongoing demand challenges despite price cuts.',
      keyTopics: ['deliveries', 'demand', 'EV', 'miss'],
    },
    {
      headline: 'Musk Confirms Return to Tesla Focus After DOGE Engagement Winds Down',
      source: 'CNBC', publishedAt: '2026-05-13T16:00:00Z',
      sentiment: 'positive', sentimentScore: 0.48, materiality: 'medium',
      explanation: 'CEO re-engagement addresses a key investor concern about management attention.',
      keyTopics: ['Musk', 'CEO', 'management', 'DOGE'],
    },
  ]),
  sentimentAggregate: {
    score: 0.18, label: 'Slightly Positive', articleCount: 16,
    breakdown: { positive: 6, neutral: 5, negative: 5 },
  },
  candles: genCandles('TSLA', 177.40),
};

const amdData: StockFullData = {
  stock: {
    ticker: 'AMD', companyName: 'Advanced Micro Devices', sector: 'Technology',
    price: 158.60, change: 0.62, changePercent: 0.39, marketCap: '$257B',
    exchange: 'NASDAQ', beta: 1.65, pe: 44.2, volume: '44.8M',
    week52High: 227.30, week52Low: 124.52,
    recommendation: 'WATCH', riskScore: 65, rewardScore: 69, confidence: 58,
  },
  indicators: {
    rsi14: 48.4, macdValue: -1.12, macdSignal: -0.68, macdHistogram: -0.44,
    bbUpper: 174.20, bbLower: 141.80, bbMiddle: 158.00, bbPosition: 'MIDDLE',
    sma50: 162.40, sma200: 174.80, volumeRatio: 1.06, technicalScore: 44,
    trendSignal: 'NEUTRAL', atr14: 9.4,
  },
  aiRec: {
    recommendation: 'WATCH', confidence: 58, riskScore: 65, rewardScore: 69,
    rationaleTechnical: 'AMD is trading below both 50-day and 200-day SMA — technically in a downtrend. RSI near 48 is neutral. Needs to reclaim $165 (SMA50) to turn constructive. MI350 GPU is a potential catalyst.',
    rationaleSimple: 'AMD is gaining ground in AI chips but still far behind NVIDIA. The stock has pulled back significantly from highs, making valuation more attractive. Wait for technical confirmation before entering.',
    keyRisks: [
      'NVIDIA maintaining dominant share in AI training market',
      'Intel\'s Gaudi 3 competing in inference workloads',
      'PC market recovery slower than expected',
    ],
    suggestedHorizon: '2–4 weeks (wait for breakout)',
    priceTarget: 190.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'AMD', [
    {
      headline: 'AMD MI350 GPU Adopted by Three Major Cloud Providers for AI Inference',
      source: 'TechCrunch', publishedAt: '2026-05-16T10:00:00Z',
      sentiment: 'positive', sentimentScore: 0.76, materiality: 'high',
      explanation: 'Cloud adoption validates AMD\'s AI chip competitiveness and opens revenue streams.',
      keyTopics: ['MI350', 'GPU', 'cloud', 'AI', 'inference'],
    },
    {
      headline: 'AMD Revenue Guidance Misses Estimates — PC Market Recovery Delayed',
      source: 'Reuters', publishedAt: '2026-05-12T14:30:00Z',
      sentiment: 'negative', sentimentScore: -0.52, materiality: 'high',
      explanation: 'Guidance miss on PC segment weighs on near-term revenue expectations.',
      keyTopics: ['guidance', 'PC', 'revenue', 'miss'],
    },
  ]),
  sentimentAggregate: {
    score: 0.22, label: 'Slightly Positive', articleCount: 9,
    breakdown: { positive: 5, neutral: 2, negative: 2 },
  },
  candles: genCandles('AMD', 158.60),
};

const pltrData: StockFullData = {
  stock: {
    ticker: 'PLTR', companyName: 'Palantir Technologies', sector: 'Technology',
    price: 28.40, change: 0.34, changePercent: 1.21, marketCap: '$62B',
    exchange: 'NYSE', beta: 1.88, pe: 82.4, volume: '58.2M',
    week52High: 38.15, week52Low: 15.66,
    recommendation: 'WATCH', riskScore: 70, rewardScore: 74, confidence: 64,
  },
  indicators: {
    rsi14: 60.2, macdValue: 0.42, macdSignal: 0.28, macdHistogram: 0.14,
    bbUpper: 31.80, bbLower: 24.40, bbMiddle: 28.10, bbPosition: 'UPPER',
    sma50: 26.40, sma200: 22.80, volumeRatio: 1.38, technicalScore: 62,
    trendSignal: 'BULLISH', atr14: 1.8,
  },
  aiRec: {
    recommendation: 'WATCH', confidence: 64, riskScore: 70, rewardScore: 74,
    rationaleTechnical: 'Technically bullish: above both moving averages with positive MACD. However, trading near upper Bollinger Band and elevated RSI of 60 suggests near-term resistance. Extreme P/E of 82x requires strong earnings growth to justify.',
    rationaleSimple: 'Palantir is a unique AI/government data play with strong revenue growth. The AIP (AI Platform) is gaining commercial traction. High valuation and high beta make it a watch-and-buy-on-dips candidate.',
    keyRisks: [
      'P/E of 82x is extremely stretched for current growth rate',
      'Government contracts vulnerable to budget cuts',
      'Commercial segment needs to sustain triple-digit growth to justify price',
    ],
    suggestedHorizon: '1–3 months (buy on dips near $25)',
    priceTarget: 36.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'PLTR', [
    {
      headline: 'Palantir AIP Wins $480M US Army Contract — Largest Commercial Deal to Date',
      source: 'Bloomberg', publishedAt: '2026-05-15T11:30:00Z',
      sentiment: 'positive', sentimentScore: 0.86, materiality: 'high',
      explanation: 'Major government contract win validates AIP platform\'s defense utility.',
      keyTopics: ['AIP', 'government', 'contract', 'defense'],
    },
    {
      headline: 'Palantir Commercial Revenue Grows 68% — Fortune 500 Adoption Accelerating',
      source: 'CNBC', publishedAt: '2026-05-14T09:00:00Z',
      sentiment: 'positive', sentimentScore: 0.78, materiality: 'high',
      explanation: 'Commercial growth diversifies revenue beyond government contracts.',
      keyTopics: ['commercial', 'revenue', 'growth', 'enterprise'],
    },
  ]),
  sentimentAggregate: {
    score: 0.71, label: 'Positive', articleCount: 8,
    breakdown: { positive: 6, neutral: 1, negative: 1 },
  },
  candles: genCandles('PLTR', 28.40),
};

const aaplData: StockFullData = {
  stock: {
    ticker: 'AAPL', companyName: 'Apple Inc', sector: 'Technology',
    price: 212.90, change: -0.43, changePercent: -0.20, marketCap: '$3.23T',
    exchange: 'NASDAQ', beta: 0.88, pe: 33.8, volume: '56.4M',
    week52High: 237.23, week52Low: 164.08,
    recommendation: 'WATCH', riskScore: 38, rewardScore: 58, confidence: 72,
  },
  indicators: {
    rsi14: 50.4, macdValue: -0.18, macdSignal: 0.12, macdHistogram: -0.30,
    bbUpper: 226.40, bbLower: 198.80, bbMiddle: 212.60, bbPosition: 'MIDDLE',
    sma50: 210.40, sma200: 201.80, volumeRatio: 0.94, technicalScore: 52,
    trendSignal: 'NEUTRAL', atr14: 5.8,
  },
  aiRec: {
    recommendation: 'WATCH', confidence: 72, riskScore: 38, rewardScore: 58,
    rationaleTechnical: 'Apple is in a consolidation phase — RSI dead neutral at 50, MACD barely negative. Lowest risk score of any stock in the universe due to massive cash hoard and buyback program. Needs catalyst to break out of range.',
    rationaleSimple: 'Apple is stable but lacks near-term catalysts. iPhone 18 launch and Apple Intelligence (AI) features could be the triggers. Best for risk-averse investors who want tech exposure with a safety net. Limited upside near-term.',
    keyRisks: [
      'iPhone unit growth stagnating in mature markets',
      'China revenue at risk from geopolitical tensions and Huawei competition',
      'Apple Intelligence adoption slower than expected',
    ],
    suggestedHorizon: '1–2 months (watch for AI catalyst)',
    priceTarget: 240.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'AAPL', [
    {
      headline: 'Apple Intelligence Features Expand to 40 New Languages in iOS 20',
      source: 'Bloomberg', publishedAt: '2026-05-16T14:30:00Z',
      sentiment: 'positive', sentimentScore: 0.62, materiality: 'medium',
      explanation: 'Broader AI feature availability expands total addressable market for premium iPhones.',
      keyTopics: ['Apple Intelligence', 'AI', 'iOS', 'international'],
    },
    {
      headline: 'Huawei Gains iPhone Market Share in China — Apple Faces 12% Revenue Headwind',
      source: 'WSJ', publishedAt: '2026-05-13T08:00:00Z',
      sentiment: 'negative', sentimentScore: -0.64, materiality: 'high',
      explanation: 'China market share loss is a material risk to Apple\'s largest growth region.',
      keyTopics: ['China', 'Huawei', 'market share', 'iPhone'],
    },
  ]),
  sentimentAggregate: {
    score: 0.24, label: 'Slightly Positive', articleCount: 13,
    breakdown: { positive: 6, neutral: 4, negative: 3 },
  },
  candles: genCandles('AAPL', 212.90),
};

const nflxData: StockFullData = {
  stock: {
    ticker: 'NFLX', companyName: 'Netflix Inc', sector: 'Communication Services',
    price: 685.20, change: 4.11, changePercent: 0.60, marketCap: '$294B',
    exchange: 'NASDAQ', beta: 1.22, pe: 46.8, volume: '8.4M',
    week52High: 788.18, week52Low: 491.78,
    recommendation: 'WATCH', riskScore: 58, rewardScore: 66, confidence: 65,
  },
  indicators: {
    rsi14: 57.2, macdValue: 4.82, macdSignal: 3.64, macdHistogram: 1.18,
    bbUpper: 722.40, bbLower: 641.80, bbMiddle: 682.10, bbPosition: 'MIDDLE',
    sma50: 664.20, sma200: 622.80, volumeRatio: 1.04, technicalScore: 61,
    trendSignal: 'BULLISH', atr14: 22.4,
  },
  aiRec: {
    recommendation: 'WATCH', confidence: 65, riskScore: 58, rewardScore: 66,
    rationaleTechnical: 'Moderately bullish with positive MACD. Above both moving averages. Decent but not exceptional technical setup. Valuation at 47x P/E is stretched for a mature streaming company.',
    rationaleSimple: 'Netflix has successfully pivoted to advertising and live events (sports). Subscriber growth is stabilizing at a high base. Good company, but the stock needs to pull back toward $640 for better risk/reward.',
    keyRisks: [
      'Password sharing crackdown growth tailwind fading',
      'Rising content costs as live sports rights become expensive',
      'Competition from Disney+, Max, and Amazon Prime Video intensifying',
    ],
    suggestedHorizon: '1–3 months (better entry near $640)',
    priceTarget: 750.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'NFLX', [
    {
      headline: 'Netflix Live Sports Rights Deal — NFL Sunday Ticket Extended Through 2032',
      source: 'Bloomberg', publishedAt: '2026-05-15T10:00:00Z',
      sentiment: 'positive', sentimentScore: 0.72, materiality: 'high',
      explanation: 'NFL rights extension cements Netflix as a sports streaming destination.',
      keyTopics: ['NFL', 'sports', 'live content', 'rights'],
    },
    {
      headline: 'Netflix Ad-Supported Tier Reaches 45M Monthly Active Users',
      source: 'Reuters', publishedAt: '2026-05-13T12:00:00Z',
      sentiment: 'positive', sentimentScore: 0.65, materiality: 'medium',
      explanation: 'Ad tier scale validates the advertising revenue diversification strategy.',
      keyTopics: ['advertising', 'AVOD', 'subscribers', 'monetization'],
    },
  ]),
  sentimentAggregate: {
    score: 0.52, label: 'Positive', articleCount: 7,
    breakdown: { positive: 5, neutral: 1, negative: 1 },
  },
  candles: genCandles('NFLX', 685.20),
};

// ─── AVOID STOCKS ────────────────────────────────────────────────────────────

const rivnData: StockFullData = {
  stock: {
    ticker: 'RIVN', companyName: 'Rivian Automotive', sector: 'Consumer Discretionary',
    price: 11.20, change: -0.39, changePercent: -3.36, marketCap: '$11.8B',
    exchange: 'NASDAQ', beta: 2.44, pe: null, volume: '22.6M',
    week52High: 21.45, week52Low: 8.26,
    recommendation: 'AVOID', riskScore: 88, rewardScore: 35, confidence: 76,
  },
  indicators: {
    rsi14: 38.2, macdValue: -0.22, macdSignal: -0.14, macdHistogram: -0.08,
    bbUpper: 14.20, bbLower: 9.80, bbMiddle: 12.00, bbPosition: 'LOWER',
    sma50: 13.40, sma200: 15.20, volumeRatio: 0.88, technicalScore: 28,
    trendSignal: 'BEARISH', atr14: 0.72,
  },
  aiRec: {
    recommendation: 'AVOID', confidence: 76, riskScore: 88, rewardScore: 35,
    rationaleTechnical: 'Strong downtrend with price below both SMA50 and SMA200. RSI at 38 approaching oversold but no reversal signals yet. MACD bearish. This is a falling knife with no technical support visible.',
    rationaleSimple: 'Rivian is burning through cash at an unsustainable rate with no clear path to profitability. While the Amazon delivery van contract provides some stability, the consumer EV market is extremely competitive. Avoid until cash position improves.',
    keyRisks: [
      'Burning $1.5B+ cash per quarter — runway concerns',
      'Amazon could reduce delivery van orders',
      'Production targets consistently missed',
      'Competition from Tesla, GM, and Ford with larger scale advantages',
    ],
    suggestedHorizon: 'Avoid — reassess in Q4 2026',
    priceTarget: 9.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'RIVN', [
    {
      headline: 'Rivian Cuts 2026 Production Forecast by 18% — Cash Burn Accelerates',
      source: 'Bloomberg', publishedAt: '2026-05-16T09:00:00Z',
      sentiment: 'negative', sentimentScore: -0.82, materiality: 'high',
      explanation: 'Production cut signals ongoing manufacturing challenges and increases cash runway concerns.',
      keyTopics: ['production', 'cash burn', 'forecast', 'manufacturing'],
    },
    {
      headline: 'Amazon Reduces Rivian Delivery Van Order by 30% — Partnership at Risk',
      source: 'WSJ', publishedAt: '2026-05-12T11:00:00Z',
      sentiment: 'negative', sentimentScore: -0.76, materiality: 'high',
      explanation: 'Order reduction from anchor customer removes a key revenue certainty.',
      keyTopics: ['Amazon', 'delivery van', 'order', 'partnership'],
    },
  ]),
  sentimentAggregate: {
    score: -0.65, label: 'Strongly Negative', articleCount: 8,
    breakdown: { positive: 1, neutral: 1, negative: 6 },
  },
  candles: genCandles('RIVN', 11.20),
};

const lcidData: StockFullData = {
  stock: {
    ticker: 'LCID', companyName: 'Lucid Group Inc', sector: 'Consumer Discretionary',
    price: 2.85, change: -0.06, changePercent: -2.06, marketCap: '$7.6B',
    exchange: 'NASDAQ', beta: 2.18, pe: null, volume: '18.4M',
    week52High: 5.34, week52Low: 2.29,
    recommendation: 'AVOID', riskScore: 92, rewardScore: 28, confidence: 82,
  },
  indicators: {
    rsi14: 32.4, macdValue: -0.08, macdSignal: -0.04, macdHistogram: -0.04,
    bbUpper: 3.80, bbLower: 2.40, bbMiddle: 3.10, bbPosition: 'LOWER',
    sma50: 3.42, sma200: 3.88, volumeRatio: 0.76, technicalScore: 18,
    trendSignal: 'BEARISH', atr14: 0.18,
  },
  aiRec: {
    recommendation: 'AVOID', confidence: 82, riskScore: 92, rewardScore: 28,
    rationaleTechnical: 'RSI approaching oversold at 32 but in established downtrend — oversold can get more oversold. Price near 52-week lows with no technical support. Extremely high risk score driven by cash burn and liquidity position.',
    rationaleSimple: 'Lucid makes beautiful cars but faces an existential cash crisis. Saudi Aramco backing provides a lifeline but equity dilution risk is significant. Production volumes remain tiny. Avoid completely.',
    keyRisks: [
      'Near-zero cash runway without new equity dilution',
      'Producing fewer than 2,000 cars per quarter — unit economics don\'t work',
      'Saudi Aramco support requires continuous capital injections',
      'Delisting risk if stock stays below $3 for extended period',
    ],
    suggestedHorizon: 'Avoid indefinitely',
    priceTarget: 2.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'LCID', [
    {
      headline: 'Lucid Raises $1.2B from Saudi Aramco — 40% Dilution for Existing Shareholders',
      source: 'Bloomberg', publishedAt: '2026-05-15T08:30:00Z',
      sentiment: 'negative', sentimentScore: -0.68, materiality: 'high',
      explanation: 'Capital raise confirms liquidity crisis and massively dilutes existing shareholders.',
      keyTopics: ['dilution', 'capital raise', 'Aramco', 'liquidity'],
    },
    {
      headline: 'Lucid Q1 Production: 1,840 Vehicles — Misses 2,200 Target',
      source: 'Reuters', publishedAt: '2026-05-13T14:00:00Z',
      sentiment: 'negative', sentimentScore: -0.74, materiality: 'high',
      explanation: 'Consistent production misses make the path to profitability unrealistic near-term.',
      keyTopics: ['production', 'miss', 'manufacturing', 'Q1'],
    },
  ]),
  sentimentAggregate: {
    score: -0.78, label: 'Strongly Negative', articleCount: 6,
    breakdown: { positive: 0, neutral: 1, negative: 5 },
  },
  candles: genCandles('LCID', 2.85),
};

const snapData: StockFullData = {
  stock: {
    ticker: 'SNAP', companyName: 'Snap Inc', sector: 'Communication Services',
    price: 9.80, change: -0.18, changePercent: -1.80, marketCap: '$16.2B',
    exchange: 'NYSE', beta: 1.94, pe: null, volume: '24.8M',
    week52High: 16.82, week52Low: 7.93,
    recommendation: 'AVOID', riskScore: 79, rewardScore: 38, confidence: 74,
  },
  indicators: {
    rsi14: 40.2, macdValue: -0.14, macdSignal: -0.08, macdHistogram: -0.06,
    bbUpper: 12.40, bbLower: 8.80, bbMiddle: 10.60, bbPosition: 'LOWER',
    sma50: 11.20, sma200: 12.40, volumeRatio: 0.92, technicalScore: 32,
    trendSignal: 'BEARISH', atr14: 0.48,
  },
  aiRec: {
    recommendation: 'AVOID', confidence: 74, riskScore: 79, rewardScore: 38,
    rationaleTechnical: 'Downtrend intact with price below both moving averages. RSI not yet oversold at 40 — further downside possible. Bearish MACD with no reversal signal.',
    rationaleSimple: 'Snap is losing the ad revenue battle to TikTok, Instagram Reels, and YouTube Shorts. User growth has plateaued and direct response advertising is underperforming. No clear path to profitability.',
    keyRisks: [
      'Ad revenue losing share to TikTok and Meta',
      'Snap AR glasses have not achieved commercial success',
      'Still not profitable — cash burn continues',
      'Potential TikTok ban lifting would increase competition',
    ],
    suggestedHorizon: 'Avoid — no near-term catalyst identified',
    priceTarget: 8.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'SNAP', [
    {
      headline: 'Snap Q1 Revenue Misses — Direct Response Ad Revenue Declines 8%',
      source: 'Bloomberg', publishedAt: '2026-05-14T13:30:00Z',
      sentiment: 'negative', sentimentScore: -0.72, materiality: 'high',
      explanation: 'Ad revenue decline signals Snap is losing advertiser wallet share.',
      keyTopics: ['revenue', 'advertising', 'miss', 'direct response'],
    },
    {
      headline: 'Snap Spectacles AR Glasses Find Niche in Enterprise Training Market',
      source: 'TechCrunch', publishedAt: '2026-05-11T10:00:00Z',
      sentiment: 'neutral', sentimentScore: 0.18, materiality: 'low',
      explanation: 'Niche enterprise use is not enough to offset core advertising weakness.',
      keyTopics: ['Spectacles', 'AR', 'enterprise', 'hardware'],
    },
  ]),
  sentimentAggregate: {
    score: -0.44, label: 'Negative', articleCount: 7,
    breakdown: { positive: 1, neutral: 2, negative: 4 },
  },
  candles: genCandles('SNAP', 9.80),
};

const byndData: StockFullData = {
  stock: {
    ticker: 'BYND', companyName: 'Beyond Meat Inc', sector: 'Consumer Staples',
    price: 6.40, change: -0.28, changePercent: -4.19, marketCap: '$394M',
    exchange: 'NASDAQ', beta: 1.82, pe: null, volume: '4.2M',
    week52High: 11.84, week52Low: 5.58,
    recommendation: 'AVOID', riskScore: 84, rewardScore: 31, confidence: 79,
  },
  indicators: {
    rsi14: 35.8, macdValue: -0.18, macdSignal: -0.12, macdHistogram: -0.06,
    bbUpper: 8.40, bbLower: 5.80, bbMiddle: 7.10, bbPosition: 'LOWER',
    sma50: 7.80, sma200: 8.90, technicalScore: 22, trendSignal: 'BEARISH',
    volumeRatio: 0.84, atr14: 0.38,
  },
  aiRec: {
    recommendation: 'AVOID', confidence: 79, riskScore: 84, rewardScore: 31,
    rationaleTechnical: 'Approaching 52-week lows with RSI at 35.8 — oversold but in structural decline. Multiple failed rallies suggest distribution. No support levels visible above $5.50.',
    rationaleSimple: 'Plant-based meat demand has collapsed. McDonald\'s and other QSR partnerships ended. The company is shrinking revenue and burning cash with no sign of turnaround.',
    keyRisks: [
      'Total addressable market shrinking as consumers return to animal protein',
      'QSR partnerships lost — no major restaurant partner',
      'Cash runway concerns — potential bankruptcy risk',
      'Competition from Impossible Foods and private label brands',
    ],
    suggestedHorizon: 'Avoid — structural business decline',
    priceTarget: 5.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'BYND', [
    {
      headline: 'Beyond Meat Revenue Falls 22% — Plant-Based Category Continues to Shrink',
      source: 'Reuters', publishedAt: '2026-05-15T11:00:00Z',
      sentiment: 'negative', sentimentScore: -0.84, materiality: 'high',
      explanation: 'Revenue decline confirms structural demand destruction in the plant-based category.',
      keyTopics: ['revenue', 'decline', 'plant-based', 'demand'],
    },
    {
      headline: 'Beyond Meat Files For New $75M Equity Raise — Dilutive Financing Concerns',
      source: 'Bloomberg', publishedAt: '2026-05-12T09:30:00Z',
      sentiment: 'negative', sentimentScore: -0.76, materiality: 'high',
      explanation: 'Equity raise at depressed prices significantly dilutes existing shareholders.',
      keyTopics: ['dilution', 'equity raise', 'cash', 'financing'],
    },
  ]),
  sentimentAggregate: {
    score: -0.72, label: 'Strongly Negative', articleCount: 6,
    breakdown: { positive: 0, neutral: 1, negative: 5 },
  },
  candles: genCandles('BYND', 6.40),
};

const paraData: StockFullData = {
  stock: {
    ticker: 'PARA', companyName: 'Paramount Global', sector: 'Communication Services',
    price: 11.90, change: -0.34, changePercent: -2.78, marketCap: '$9.1B',
    exchange: 'NASDAQ', beta: 1.48, pe: null, volume: '12.4M',
    week52High: 19.02, week52Low: 9.88,
    recommendation: 'AVOID', riskScore: 76, rewardScore: 40, confidence: 68,
  },
  indicators: {
    rsi14: 42.4, macdValue: -0.08, macdSignal: -0.04, macdHistogram: -0.04,
    bbUpper: 14.20, bbLower: 10.20, bbMiddle: 12.20, bbPosition: 'LOWER',
    sma50: 13.40, sma200: 14.80, volumeRatio: 0.96, technicalScore: 34,
    trendSignal: 'BEARISH', atr14: 0.62,
  },
  aiRec: {
    recommendation: 'AVOID', confidence: 68, riskScore: 76, rewardScore: 40,
    rationaleTechnical: 'Bearish structure with price below key moving averages. Approaching 52-week lows. RSI at 42 neutral-bearish. Dividend cut risk adds further downside pressure.',
    rationaleSimple: 'Paramount is a legacy media company struggling with cord-cutting and streaming competition. Paramount+ has not achieved the scale needed to offset linear TV decline. Skydance merger uncertainty creates additional risk.',
    keyRisks: [
      'Skydance acquisition deal falling through',
      'Linear TV ratings in structural decline',
      'Paramount+ subscriber growth well below Netflix/Disney+',
      'High debt load with tightening credit conditions',
    ],
    suggestedHorizon: 'Avoid — merger outcome uncertainty',
    priceTarget: 10.00,
    updatedAt: '2026-05-17T13:45:00Z',
  },
  news: makeNews('n', 'PARA', [
    {
      headline: 'Skydance-Paramount Merger Faces FTC Second Request — Closure Delayed to Q4',
      source: 'Variety', publishedAt: '2026-05-15T14:00:00Z',
      sentiment: 'negative', sentimentScore: -0.55, materiality: 'high',
      explanation: 'FTC review delays the merger, extending uncertainty for Paramount shareholders.',
      keyTopics: ['Skydance', 'merger', 'FTC', 'antitrust'],
    },
    {
      headline: 'Paramount+ Misses Subscriber Target by 2M — Streaming Strategy Under Pressure',
      source: 'Bloomberg', publishedAt: '2026-05-13T10:30:00Z',
      sentiment: 'negative', sentimentScore: -0.62, materiality: 'high',
      explanation: 'Subscriber miss undermines the streaming-first narrative Paramount depends on.',
      keyTopics: ['Paramount+', 'subscribers', 'streaming', 'miss'],
    },
  ]),
  sentimentAggregate: {
    score: -0.42, label: 'Negative', articleCount: 8,
    breakdown: { positive: 1, neutral: 2, negative: 5 },
  },
  candles: genCandles('PARA', 11.90),
};

// ─── MASTER DATA MAP ──────────────────────────────────────────────────────────

export const ALL_STOCKS: Record<string, StockFullData> = {
  NVDA: nvdaData,
  AMZN: amznData,
  META: metaData,
  GOOGL: googlData,
  MSFT: msftData,
  TSLA: tslaData,
  AMD: amdData,
  PLTR: pltrData,
  AAPL: aaplData,
  NFLX: nflxData,
  RIVN: rivnData,
  LCID: lcidData,
  SNAP: snapData,
  BYND: byndData,
  PARA: paraData,
};

export const STOCK_LIST: Stock[] = Object.values(ALL_STOCKS).map((d) => d.stock);

export const INVEST_TICKERS = ['NVDA', 'AMZN', 'META', 'GOOGL', 'MSFT'];
export const WATCH_TICKERS = ['TSLA', 'AMD', 'PLTR', 'AAPL', 'NFLX'];
export const AVOID_TICKERS = ['RIVN', 'LCID', 'SNAP', 'BYND', 'PARA'];

export const SECTORS: SectorData[] = [
  { name: 'Technology', ticker: 'XLK', changePercent: 1.42, trend: 'up' },
  { name: 'Healthcare', ticker: 'XLV', changePercent: 0.78, trend: 'up' },
  { name: 'Communication', ticker: 'XLC', changePercent: 0.54, trend: 'up' },
  { name: 'Financials', ticker: 'XLF', changePercent: 0.21, trend: 'up' },
  { name: 'Industrials', ticker: 'XLI', changePercent: 0.48, trend: 'up' },
  { name: 'Utilities', ticker: 'XLU', changePercent: 0.12, trend: 'up' },
  { name: 'Cons. Staples', ticker: 'XLP', changePercent: -0.08, trend: 'flat' },
  { name: 'Materials', ticker: 'XLB', changePercent: -0.34, trend: 'down' },
  { name: 'Cons. Disc.', ticker: 'XLY', changePercent: -0.28, trend: 'down' },
  { name: 'Energy', ticker: 'XLE', changePercent: -0.72, trend: 'down' },
  { name: 'Real Estate', ticker: 'XLRE', changePercent: -1.18, trend: 'down' },
];

export const MARKET_INDICES: MarketIndex[] = [
  { name: 'S&P 500', value: '5,842.14', change: '+48.32', changePercent: '+0.83%', direction: 'up' },
  { name: 'NASDAQ', value: '18,674.55', change: '+142.18', changePercent: '+0.77%', direction: 'up' },
  { name: 'DOW', value: '42,189.30', change: '-24.44', changePercent: '-0.06%', direction: 'down' },
  { name: 'VIX', value: '14.82', change: '-0.94', changePercent: '-5.97%', direction: 'down' },
];
