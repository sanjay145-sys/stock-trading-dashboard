'use client';

import Header from '@/components/layout/Header';
import StockList from '@/components/stocks/StockList';
import StockDetail from '@/components/stocks/StockDetail';
import NewsFeed from '@/components/news/NewsFeed';
import SectorHeatmap from '@/components/sectors/SectorHeatmap';
import { useDashboardStore } from '@/lib/store';
import { useStocks } from '@/hooks/useStocks';

export default function DashboardPage() {
  const { selectedTicker } = useDashboardStore();
  const { tickers, stocks, isMockData } = useStocks();

  const selectedData = stocks[selectedTicker];
  const totalCount = Object.keys(stocks).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Stock list — real-time ranked + grouped */}
        <StockList
          tickers={tickers}
          stocks={stocks}
          isMockData={isMockData}
          totalCount={totalCount}
        />

        {/* Center: Stock detail panel */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <StockDetail data={selectedData} />
        </main>

        {/* Right: News feed + sector heatmap */}
        <aside
          className="flex-none w-80 flex flex-col border-l border-zinc-800 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-surface)' }}
        >
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {selectedData ? (
              <NewsFeed
                ticker={selectedTicker}
                articles={selectedData.news}
                sentimentAggregate={selectedData.sentimentAggregate}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-600">Fetching news…</p>
              </div>
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
