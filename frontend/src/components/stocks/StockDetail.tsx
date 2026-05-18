'use client';

import dynamic from 'next/dynamic';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import TechnicalPanel from '@/components/indicators/TechnicalPanel';
import RecommendationCard from '@/components/recommendation/RecommendationCard';
import type { StockFullData, Timeframe } from '@/types';

const PriceChart = dynamic(() => import('./PriceChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <BarChart2 className="w-8 h-8 text-zinc-700 animate-pulse" />
        <p className="text-xs text-zinc-600">Loading chart…</p>
      </div>
    </div>
  ),
});

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y'];

interface StockDetailProps {
  data: StockFullData | undefined;
}

export default function StockDetail({ data }: StockDetailProps) {
  const { activeTimeframe, setActiveTimeframe } = useDashboardStore();

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <BarChart2 className="w-12 h-12 text-zinc-800 mx-auto mb-3 animate-pulse" />
          <p className="text-zinc-600 text-sm">Loading market data…</p>
          <p className="text-zinc-700 text-xs mt-1">Fetching real-time data from markets</p>
        </div>
      </div>
    );
  }

  const { stock, indicators, aiRec, candles } = data;
  const isPositive = stock.change >= 0;

  const REC_COLOR = {
    INVEST: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    WATCH: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    AVOID: 'text-red-400 bg-red-500/10 border-red-500/30',
  }[stock.recommendation];

  const rangePercent = stock.week52High > stock.week52Low
    ? ((stock.price - stock.week52Low) / (stock.week52High - stock.week52Low)) * 100
    : 50;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="p-4 space-y-4">
        {/* Stock header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-zinc-100">{stock.ticker}</h2>
              <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${REC_COLOR}`}>
                {stock.recommendation}
              </span>
              <span className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                {stock.exchange}
              </span>
            </div>
            <p className="text-sm text-zinc-500 mt-0.5">{stock.companyName} · {stock.sector}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-zinc-100">${stock.price.toFixed(2)}</p>
            <div
              className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}${stock.change.toFixed(2)} ({isPositive ? '+' : ''}
              {stock.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Market Cap', value: stock.marketCap },
            { label: 'P/E Ratio', value: stock.pe != null ? Number(stock.pe).toFixed(1) : 'N/A' },
            { label: 'Beta', value: Number(stock.beta).toFixed(2) },
            { label: 'Volume', value: stock.volume },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-lg border border-zinc-800 px-3 py-2"
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-zinc-100 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* 52w range */}
        <div
          className="rounded-lg border border-zinc-800 px-3 py-2.5"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wide">52-Week Range</span>
            <span className="text-[10px] text-zinc-600">
              ${Number(stock.week52Low).toFixed(2)} – ${Number(stock.week52High).toFixed(2)}
            </span>
          </div>
          <div className="relative h-1.5 rounded-full bg-zinc-800">
            <div
              className="absolute top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500"
              style={{ width: '100%', opacity: 0.3 }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-500/30"
              style={{ left: `calc(${Math.max(0, Math.min(100, rangePercent))}% - 6px)` }}
            />
          </div>
        </div>

        {/* Chart */}
        <div
          className="rounded-xl border border-zinc-800 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">Price Chart</span>
            <div className="flex items-center gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    activeTimeframe === tf
                      ? 'bg-indigo-600 text-white'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <PriceChart candles={candles} ticker={stock.ticker} timeframe={activeTimeframe} />
          </div>
        </div>

        {/* Technical + Recommendation side by side */}
        <div className="grid grid-cols-2 gap-4">
          <TechnicalPanel indicators={indicators} currentPrice={stock.price} />
          <RecommendationCard aiRec={aiRec} ticker={stock.ticker} />
        </div>
      </div>
    </div>
  );
}
