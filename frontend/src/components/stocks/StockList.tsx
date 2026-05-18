'use client';

import { Search, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import StockCard from './StockCard';
import { useDashboardStore } from '@/lib/store';
import type { Stock } from '@/types';

interface StocksListProps {
  tickers: { INVEST: string[]; WATCH: string[]; AVOID: string[] };
  stocks: Record<string, { stock: Stock }>;
  isMockData: boolean;
  totalCount: number;
}

const SECTIONS = [
  { label: 'INVEST', key: 'INVEST', color: 'text-emerald-400', border: 'border-l-emerald-500' },
  { label: 'WATCH', key: 'WATCH', color: 'text-amber-400', border: 'border-l-amber-500' },
  { label: 'AVOID', key: 'AVOID', color: 'text-red-400', border: 'border-l-red-500' },
] as const;

export default function StockList({ tickers, stocks, isMockData, totalCount }: StocksListProps) {
  const { selectedTicker, setSelectedTicker } = useDashboardStore();
  const [query, setQuery] = useState('');

  const allTickers = [...tickers.INVEST, ...tickers.WATCH, ...tickers.AVOID];

  const filteredTickers = query.length > 0
    ? allTickers.filter((t) => {
        const stock = stocks[t]?.stock;
        if (!stock) return false;
        const q = query.toLowerCase();
        return t.toLowerCase().includes(q) || stock.companyName.toLowerCase().includes(q);
      })
    : null;

  return (
    <aside
      className="flex-none w-64 flex flex-col border-r border-zinc-800 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Search */}
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search stocks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
          />
        </div>
      </div>

      {/* Stock groups */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-4">
        {SECTIONS.map(({ label, key, color, border }) => {
          const sectionTickers = tickers[key] as string[];
          const visible = filteredTickers
            ? sectionTickers.filter((t) => filteredTickers.includes(t))
            : sectionTickers;

          if (visible.length === 0) return null;

          return (
            <div key={label}>
              <div className={`flex items-center gap-2 px-1 mb-1.5 border-l-2 pl-2 ${border}`}>
                <span className={`text-[10px] font-bold tracking-widest ${color}`}>{label}</span>
                <span className="text-[10px] text-zinc-600">({visible.length})</span>
              </div>
              <div className="space-y-0.5">
                {visible.map((ticker) => {
                  const stock = stocks[ticker]?.stock;
                  if (!stock) return null;
                  return (
                    <StockCard
                      key={ticker}
                      stock={stock}
                      isSelected={selectedTicker === ticker}
                      onClick={() => setSelectedTicker(ticker)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-zinc-800 flex items-center gap-1.5">
        {isMockData ? (
          <WifiOff className="w-3 h-3 text-amber-500 flex-shrink-0" />
        ) : (
          <Wifi className="w-3 h-3 text-emerald-500 flex-shrink-0" />
        )}
        <p className="text-[10px] text-zinc-600">
          {totalCount} stocks · {isMockData ? 'Demo data' : 'Live data'}
        </p>
      </div>
    </aside>
  );
}
