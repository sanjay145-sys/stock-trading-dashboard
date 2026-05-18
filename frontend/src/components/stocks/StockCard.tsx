'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Stock, Recommendation } from '@/types';

const REC_CONFIG: Record<Recommendation, { dot: string; label: string; bg: string }> = {
  INVEST: { dot: 'bg-emerald-400', label: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  WATCH: { dot: 'bg-amber-400', label: 'text-amber-400', bg: 'bg-amber-500/10' },
  AVOID: { dot: 'bg-red-400', label: 'text-red-400', bg: 'bg-red-500/10' },
};

interface StockCardProps {
  stock: Stock;
  isSelected: boolean;
  onClick: () => void;
}

export default function StockCard({ stock, isSelected, onClick }: StockCardProps) {
  const cfg = REC_CONFIG[stock.recommendation];
  const isPositive = stock.change >= 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150 group ${
        isSelected
          ? 'bg-indigo-600/20 border border-indigo-500/40'
          : 'border border-transparent hover:bg-zinc-800/60'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
          <div>
            <span className="text-sm font-bold text-zinc-100">{stock.ticker}</span>
            <p className="text-[10px] text-zinc-500 truncate max-w-[110px]">{stock.companyName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-100">${stock.price.toFixed(2)}</p>
          <div
            className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${
              isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-1.5 flex items-center gap-2">
        <div className="flex-1 h-0.5 rounded-full bg-zinc-800">
          <div
            className={`h-full rounded-full ${cfg.dot}`}
            style={{ width: `${stock.confidence}%` }}
          />
        </div>
        <span className="text-[10px] text-zinc-500">{stock.confidence}%</span>
      </div>
    </button>
  );
}
