interface GaugeProps {
  value: number;
  label: string;
  variant: 'risk' | 'reward' | 'confidence';
}

function getGaugeColor(value: number, variant: 'risk' | 'reward' | 'confidence') {
  if (variant === 'risk') {
    if (value >= 75) return { bar: 'bg-red-500', text: 'text-red-400', glow: '#ef4444' };
    if (value >= 50) return { bar: 'bg-amber-500', text: 'text-amber-400', glow: '#f59e0b' };
    return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: '#10b981' };
  }
  if (variant === 'reward') {
    if (value >= 75) return { bar: 'bg-emerald-500', text: 'text-emerald-400', glow: '#10b981' };
    if (value >= 50) return { bar: 'bg-amber-500', text: 'text-amber-400', glow: '#f59e0b' };
    return { bar: 'bg-red-500', text: 'text-red-400', glow: '#ef4444' };
  }
  // confidence
  if (value >= 75) return { bar: 'bg-indigo-500', text: 'text-indigo-400', glow: '#6366f1' };
  if (value >= 55) return { bar: 'bg-blue-500', text: 'text-blue-400', glow: '#3b82f6' };
  return { bar: 'bg-zinc-500', text: 'text-zinc-400', glow: '#71717a' };
}

export default function RiskRewardGauge({ value, label, variant }: GaugeProps) {
  const { bar, text } = getGaugeColor(value, variant);
  const r = 28;
  const circ = Math.PI * r;
  const dashOffset = circ * (1 - value / 100);
  const strokeColor =
    variant === 'risk'
      ? value >= 75
        ? '#ef4444'
        : value >= 50
        ? '#f59e0b'
        : '#10b981'
      : variant === 'reward'
      ? value >= 75
        ? '#10b981'
        : value >= 50
        ? '#f59e0b'
        : '#ef4444'
      : value >= 75
      ? '#6366f1'
      : value >= 55
      ? '#3b82f6'
      : '#71717a';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-12 overflow-hidden">
        <svg
          width="80"
          height="48"
          viewBox="0 0 80 48"
          className="absolute inset-0"
        >
          {/* Background arc */}
          <path
            d="M 8 44 A 32 32 0 0 1 72 44"
            fill="none"
            stroke="#27272a"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 8 44 A 32 32 0 0 1 72 44"
            fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${dashOffset}`}
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className={`text-base font-black ${text}`}>{value}</span>
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium">{label}</span>
    </div>
  );
}
