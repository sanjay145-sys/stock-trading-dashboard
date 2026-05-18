import type { StockFullData } from '@/types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== 'undefined' ? 'http://localhost:8000' : 'http://localhost:8000');

export interface ApiStocksResponse {
  tickers: { INVEST: string[]; WATCH: string[]; AVOID: string[] };
  stocks: Record<string, StockFullData>;
  lastRefresh: string | null;
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: 0 },
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchAllStocks = (): Promise<ApiStocksResponse> =>
  apiFetch<ApiStocksResponse>('/api/stocks');

export const fetchStock = (ticker: string): Promise<StockFullData> =>
  apiFetch<StockFullData>(`/api/stocks/${ticker}`);

export const triggerRefresh = (): Promise<{ status: string }> =>
  fetch(`${API_URL}/api/refresh`, { method: 'POST' }).then((r) => r.json());

export const fetchHealth = () =>
  apiFetch<{
    status: string;
    ai_enabled: boolean;
    tracked_stocks: number;
    last_refresh: string | null;
    next_refresh_in_seconds: number | null;
  }>('/api/health');
