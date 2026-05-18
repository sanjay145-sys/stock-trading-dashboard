import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SECTORS } from '@/lib/mock-data';

function getHeatColor(pct: number): string {
  if (pct >= 1.5) return 'bg-emerald-500/30 border-emerald-500/40 text-emerald-300';
  if (pct >= 0.5) return 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400';
  if (pct >= 0.1) return 'bg-emerald-500/8 border-emerald-500/15 text-emerald-500';
  if (pct >= -0.1) return 'bg-zinc-800/50 border-zinc-700 text-zinc-400';
  if (pct >= -0.5) return 'bg-red-500/8 border-red-500/15 text-red-500';
  if (pct >= -1.0) return 'bg-red-500/15 border-red-500/25 text-red-400';
  return 'bg-red-500/30 border-red-500/40 text-red-300';
}

export default function SectorHeatmap() {
  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
        Sector Performance
      </h3>
      <div className="grid grid-cols-2 gap-1.5">
        {SECTORS.map((sector) => {
          const isUp = sector.changePercent > 0.1;
          const isDown = sector.changePercent < -0.1;
          const colorClass = getHeatColor(sector.changePercent);

          return (
            <div
              key={sector.name}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg border ${colorClass} transition-all duration-300`}
            >
              <span className="text-[11px] font-medium truncate">{sector.name}</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                {isDown ? (
                  <TrendingDown className="w-2.5 h-2.5" />
                ) : isUp ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <Minus className="w-2.5 h-2.5" />
                )}
                <span className="text-[10px] font-bold">
                  {sector.changePercent >= 0 ? '+' : ''}
                  {sector.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
