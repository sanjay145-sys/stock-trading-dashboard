'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import StockCard from './StockCard';
import { useDashboardStore } from '@/lib/store';
import { STOCK_LIST, INVEST_TICKERS, WATCH_TICKERS, AVOID_TICKERS } from '@/lib/mock-data';

const SECTIONS = [
  { label: 'INVEST', tickers: INVEST_TICKERS, color: 'text-emerald-400', border: 'border-l-emerald-500' },
  { label: 'WATCH', tickers: WATCH_TICKERS, color: 'text-amber-400', border: 'border-l-amber-500' },
  { label: 'AVOID', tickers: AVOID_TICKERS, color: 'text-red-400', border: 'border-l-red-500' },
] as const;

export default function StockList() {
  const { selectedTicker, setSelectedTicker } = useDashboardStore();
  const [query, setQuery] = useState('');

  const allStocks = STOCK_LIST;
  const filteredTickers = query
    ? allStocks
        .filter(
          (s) =>
            s.ticker.toLowerCase().includes(query.toLowerCase()) ||
            s.companyName.toLowerCase().includes(query.toLowerCase())
        )
        .map((s) => s.ticker)
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
        {SECTIONS.map(({ label, tickers, color, border }) => {
          const visible = filteredTickers
            ? tickers.filter((t) => filteredTickers.includes(t))
            : tickers;

          if (visible.length === 0) return null;

          return (
            <div key={label}>
              <div className={`flex items-center gap-2 px-1 mb-1.5 border-l-2 pl-2 ${border}`}>
                <span className={`text-[10px] font-bold tracking-widest ${color}`}>{label}</span>
                <span className="text-[10px] text-zinc-600">({visible.length})</span>
              </div>
              <div className="space-y-0.5">
                {visible.map((ticker) => {
                  const stock = allStocks.find((s) => s.ticker === ticker);
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
      <div className="p-2.5 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 text-center">
          {allStocks.length} stocks tracked · Auto-discovered
        </p>
      </div>
    </aside>
  );
}
