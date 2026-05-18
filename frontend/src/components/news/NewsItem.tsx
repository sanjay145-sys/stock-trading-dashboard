import type { NewsArticle } from '@/types';

const SENTIMENT_CONFIG = {
  positive: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400', label: 'Positive' },
  neutral: { badge: 'bg-zinc-700/40 text-zinc-400 border-zinc-700', dot: 'bg-zinc-500', label: 'Neutral' },
  negative: { badge: 'bg-red-500/15 text-red-400 border-red-500/20', dot: 'bg-red-400', label: 'Negative' },
};

const MATERIALITY_CONFIG = {
  high: 'text-amber-400',
  medium: 'text-zinc-400',
  low: 'text-zinc-600',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ago`;
  if (h >= 1) return `${h}h ago`;
  return `${m}m ago`;
}

interface NewsItemProps {
  article: NewsArticle;
}

export default function NewsItem({ article }: NewsItemProps) {
  const cfg = SENTIMENT_CONFIG[article.sentiment];
  const matColor = MATERIALITY_CONFIG[article.materiality];

  return (
    <div className="px-3 py-3 border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <span className="text-[10px] text-zinc-600">{article.source}</span>
          <span className="text-[10px] text-zinc-700">·</span>
          <span className="text-[10px] text-zinc-600">{timeAgo(article.publishedAt)}</span>
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wide ${matColor}`}>
          {article.materiality}
        </span>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed mb-1.5 group-hover:text-zinc-200 transition-colors">
        {article.headline}
      </p>

      <p className="text-[11px] text-zinc-600 leading-relaxed mb-2">{article.explanation}</p>

      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${cfg.badge}`}>
          {cfg.label}
          <span className="opacity-70">
            {article.sentimentScore >= 0 ? '+' : ''}{article.sentimentScore.toFixed(2)}
          </span>
        </span>
        {article.keyTopics.slice(0, 2).map((topic) => (
          <span
            key={topic}
            className="px-1.5 py-0.5 rounded text-[9px] text-zinc-600 bg-zinc-800 border border-zinc-700/50"
          >
            {topic}
          </span>
        ))}
      </div>
    </div>
  );
}
