import type { TechnicalIndicators } from '@/types';

interface TechnicalPanelProps {
  indicators: TechnicalIndicators;
  currentPrice: number;
}

function getRsiLabel(rsi: number) {
  if (rsi >= 70) return { label: 'Overbought', color: 'text-red-400' };
  if (rsi >= 60) return { label: 'Strong', color: 'text-emerald-400' };
  if (rsi >= 40) return { label: 'Neutral', color: 'text-zinc-400' };
  if (rsi >= 30) return { label: 'Weak', color: 'text-amber-400' };
  return { label: 'Oversold', color: 'text-red-400' };
}

function getRsiBarColor(rsi: number) {
  if (rsi >= 70 || rsi < 30) return 'bg-red-500';
  if (rsi >= 60) return 'bg-emerald-500';
  if (rsi >= 40) return 'bg-zinc-500';
  return 'bg-amber-500';
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold ${color ?? 'text-zinc-100'}`}>{value}</span>
      {sub && <span className="text-[10px] text-zinc-600">{sub}</span>}
    </div>
  );
}

export default function TechnicalPanel({ indicators, currentPrice }: TechnicalPanelProps) {
  const rsiLabel = getRsiLabel(indicators.rsi14);
  const rsiBarColor = getRsiBarColor(indicators.rsi14);
  const isMacdBullish = indicators.macdHistogram > 0;
  const isSmaGoldenCross = indicators.sma50 > indicators.sma200;
  const distFromHigh200 = ((currentPrice - indicators.sma200) / indicators.sma200) * 100;

  const trendColor =
    indicators.trendSignal === 'BULLISH'
      ? 'text-emerald-400'
      : indicators.trendSignal === 'BEARISH'
      ? 'text-red-400'
      : 'text-zinc-400';

  return (
    <div
      className="rounded-xl border border-zinc-800 p-4"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
          Technical Indicators
        </h3>
        <span className={`text-xs font-bold ${trendColor}`}>
          {indicators.trendSignal}
        </span>
      </div>

      {/* RSI */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500">RSI (14)</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-zinc-100">{indicators.rsi14.toFixed(1)}</span>
            <span className={`text-[10px] font-medium ${rsiLabel.color}`}>{rsiLabel.label}</span>
          </div>
        </div>
        <div className="relative h-1.5 rounded-full bg-zinc-800">
          {/* Zone markers */}
          <div className="absolute left-[30%] top-0 h-full w-px bg-zinc-700" />
          <div className="absolute left-[70%] top-0 h-full w-px bg-zinc-700" />
          <div
            className={`h-full rounded-full transition-all duration-700 ${rsiBarColor}`}
            style={{ width: `${indicators.rsi14}%` }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-zinc-700">Oversold 30</span>
          <span className="text-[9px] text-zinc-700">70 Overbought</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Stat
          label="MACD"
          value={isMacdBullish ? 'Bullish ↑' : 'Bearish ↓'}
          sub={`Hist: ${indicators.macdHistogram.toFixed(2)}`}
          color={isMacdBullish ? 'text-emerald-400' : 'text-red-400'}
        />
        <Stat
          label="Bollinger Band"
          value={indicators.bbPosition}
          sub={`Width: $${(indicators.bbUpper - indicators.bbLower).toFixed(2)}`}
          color={
            indicators.bbPosition === 'UPPER'
              ? 'text-amber-400'
              : indicators.bbPosition === 'LOWER'
              ? 'text-blue-400'
              : 'text-zinc-400'
          }
        />
        <Stat
          label="SMA 50 vs 200"
          value={isSmaGoldenCross ? 'Golden Cross ✓' : 'Death Cross ✗'}
          sub={`50d: $${indicators.sma50.toFixed(0)} / 200d: $${indicators.sma200.toFixed(0)}`}
          color={isSmaGoldenCross ? 'text-emerald-400' : 'text-red-400'}
        />
        <Stat
          label="Vol Ratio"
          value={`${indicators.volumeRatio.toFixed(2)}x avg`}
          sub={indicators.volumeRatio > 1.2 ? 'Above average ↑' : indicators.volumeRatio < 0.8 ? 'Below average ↓' : 'Near average'}
          color={indicators.volumeRatio > 1.2 ? 'text-emerald-400' : indicators.volumeRatio < 0.8 ? 'text-zinc-500' : 'text-zinc-400'}
        />
        <Stat
          label="ATR (14)"
          value={`$${indicators.atr14.toFixed(2)}`}
          sub="Avg daily range"
        />
        <Stat
          label="vs SMA 200"
          value={`${distFromHigh200 >= 0 ? '+' : ''}${distFromHigh200.toFixed(1)}%`}
          color={distFromHigh200 > 0 ? 'text-emerald-400' : 'text-red-400'}
          sub={distFromHigh200 > 0 ? 'Above trend' : 'Below trend'}
        />
      </div>

      {/* Score bar */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Technical Score</span>
          <span className="text-sm font-bold text-zinc-100">{indicators.technicalScore}/100</span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
            style={{ width: `${indicators.technicalScore}%` }}
          />
        </div>
      </div>
    </div>
  );
}
