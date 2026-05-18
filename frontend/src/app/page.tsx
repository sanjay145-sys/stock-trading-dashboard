'use client';

import Header from '@/components/layout/Header';
import StockList from '@/components/stocks/StockList';
import StockDetail from '@/components/stocks/StockDetail';
import NewsFeed from '@/components/news/NewsFeed';
import SectorHeatmap from '@/components/sectors/SectorHeatmap';
import { useDashboardStore } from '@/lib/store';
import { ALL_STOCKS } from '@/lib/mock-data';

export default function DashboardPage() {
  const { selectedTicker } = useDashboardStore();
  const data = ALL_STOCKS[selectedTicker];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Stock list */}
        <StockList />

        {/* Center: Stock detail */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <StockDetail />
        </main>

        {/* Right: News + Sector heatmap */}
        <aside
          className="flex-none w-80 flex flex-col border-l border-zinc-800 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {data && (
              <NewsFeed
                ticker={selectedTicker}
                articles={data.news}
                sentimentAggregate={data.sentimentAggregate}
              />
            )}
          </div>

          <div className="border-t border-zinc-800 flex-shrink-0 overflow-y-auto scrollbar-thin max-h-72">
            <SectorHeatmap />
          </div>
        </aside>
      </div>
    </div>
  );
}
