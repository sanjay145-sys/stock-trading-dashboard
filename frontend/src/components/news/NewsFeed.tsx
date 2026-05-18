import { Newspaper } from 'lucide-react';
import NewsItem from './NewsItem';
import type { NewsArticle, SentimentAggregate } from '@/types';

interface NewsFeedProps {
  ticker: string;
  articles: NewsArticle[];
  sentimentAggregate: SentimentAggregate;
}

function SentimentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-zinc-500 w-14">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-600 w-4 text-right">{count}</span>
    </div>
  );
}

export default function NewsFeed({ ticker, articles, sentimentAggregate }: NewsFeedProps) {
  const scoreColor =
    sentimentAggregate.score >= 0.3
      ? 'text-emerald-400'
      : sentimentAggregate.score <= -0.3
      ? 'text-red-400'
      : 'text-amber-400';

  const scoreBarColor =
    sentimentAggregate.score >= 0.3
      ? 'bg-emerald-500'
      : sentimentAggregate.score <= -0.3
      ? 'bg-red-500'
      : 'bg-amber-500';

  const scoreBarWidth = ((sentimentAggregate.score + 1) / 2) * 100;
  const { positive, neutral, negative } = sentimentAggregate.breakdown;
  const total = positive + neutral + negative;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* Sentiment Summary */}
      <div className="p-3 border-b border-zinc-800" style={{ backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center gap-1.5 mb-2">
          <Newspaper className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-300">News Sentiment</span>
          <span className="text-[10px] text-zinc-600 ml-auto">{ticker} · {sentimentAggregate.articleCount} articles (72h)</span>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-zinc-600">–1</span>
          <div className="relative flex-1 h-2 rounded-full bg-zinc-800">
            <div
              className={`absolute top-0 h-full rounded-full ${scoreBarColor} transition-all duration-700`}
              style={{ width: `${scoreBarWidth}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-zinc-900 shadow"
              style={{ left: `calc(${scoreBarWidth}% - 5px)` }}
            />
          </div>
          <span className="text-[10px] text-zinc-600">+1</span>
          <span className={`text-sm font-bold ml-1 ${scoreColor}`}>
            {sentimentAggregate.score >= 0 ? '+' : ''}{sentimentAggregate.score.toFixed(2)}
          </span>
        </div>

        <p className={`text-xs font-semibold mb-2 ${scoreColor}`}>{sentimentAggregate.label}</p>

        {/* Breakdown */}
        <div className="space-y-1">
          <SentimentBar label="Positive" count={positive} total={total} color="bg-emerald-500" />
          <SentimentBar label="Neutral" count={neutral} total={total} color="bg-zinc-500" />
          <SentimentBar label="Negative" count={negative} total={total} color="bg-red-500" />
        </div>
      </div>

      {/* Articles */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {articles.length === 0 ? (
          <div className="p-6 text-center text-xs text-zinc-600">No news articles found for this period.</div>
        ) : (
          articles.map((article) => <NewsItem key={article.id} article={article} />)
        )}
      </div>
    </div>
  );
}
