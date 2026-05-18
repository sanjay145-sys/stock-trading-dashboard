'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllStocks, fetchHealth } from '@/lib/api';
import { ALL_STOCKS, INVEST_TICKERS, WATCH_TICKERS, AVOID_TICKERS } from '@/lib/mock-data';
import { useDashboardStore } from '@/lib/store';
import type { StockFullData } from '@/types';

const FIVE_MIN = 5 * 60 * 1000;

const MOCK_TICKERS = { INVEST: INVEST_TICKERS, WATCH: WATCH_TICKERS, AVOID: AVOID_TICKERS };
const MOCK_STOCKS = ALL_STOCKS as unknown as Record<string, StockFullData>;

export function useStocks() {
  const { selectedTicker, setSelectedTicker } = useDashboardStore();

  const { data, isError, isFetching } = useQuery({
    queryKey: ['stocks'],
    queryFn: fetchAllStocks,
    staleTime: 4 * 60 * 1000,
    refetchInterval: FIVE_MIN,
    retry: 2,
    placeholderData: {
      tickers: MOCK_TICKERS,
      stocks: MOCK_STOCKS,
      lastRefresh: null,
    },
  });

  // True real data = API returned stocks AND a lastRefresh timestamp
  const hasRealData =
    Boolean(data?.lastRefresh) &&
    Object.keys(data?.stocks ?? {}).length > 0;

  const effectiveTickers = hasRealData ? data!.tickers : MOCK_TICKERS;
  const effectiveStocks = hasRealData ? data!.stocks : MOCK_STOCKS;

  // Auto-select the first INVEST stock if the current selection isn't in the loaded set
  useEffect(() => {
    if (!hasRealData) return;
    if (!effectiveStocks[selectedTicker]) {
      const first = [
        ...effectiveTickers.INVEST,
        ...effectiveTickers.WATCH,
        ...effectiveTickers.AVOID,
      ][0];
      if (first) setSelectedTicker(first);
    }
  }, [hasRealData, effectiveStocks, effectiveTickers, selectedTicker, setSelectedTicker]);

  return {
    tickers: effectiveTickers,
    stocks: effectiveStocks,
    lastRefresh: data?.lastRefresh ?? null,
    isMockData: !hasRealData,
    isFetching,
    totalCount: Object.keys(effectiveStocks).length,
  };
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
