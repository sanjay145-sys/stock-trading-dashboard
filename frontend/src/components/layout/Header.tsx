'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Minus, Wifi, WifiOff, Zap } from 'lucide-react';
import { MARKET_INDICES } from '@/lib/mock-data';
import { useHealth } from '@/hooks/useStocks';
import { triggerRefresh } from '@/lib/api';
import type { MarketIndex } from '@/types';

function IndexBadge({ idx }: { idx: MarketIndex }) {
  const isUp = idx.direction === 'up';
  const isFlat = idx.direction === 'flat';
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
      <span className="text-xs font-medium text-zinc-400">{idx.name}</span>
      <span className="text-sm font-bold text-zinc-100">{idx.value}</span>
      <span
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          isFlat ? 'text-zinc-400' : isUp ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {isFlat ? (
          <Minus className="w-3 h-3" />
        ) : isUp ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        {idx.changePercent}
      </span>
    </div>
  );
}

export default function Header() {
  const { data: health } = useHealth();
  const [countdown, setCountdown] = useState(300);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manualRefreshing, setManualRefreshing] = useState(false);

  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  // Sync countdown from backend health if available
  useEffect(() => {
    if (health?.next_refresh_in_seconds != null) {
      setCountdown(health.next_refresh_in_seconds);
    }
  }, [health?.next_refresh_in_seconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setIsRefreshing(true);
          setTimeout(() => {
            setIsRefreshing(false);
            setLastUpdated(
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
          }, 1200);
          return 300;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  const isMarketOpen = (() => {
    const now = new Date();
    const h = now.getHours();
    const d = now.getDay();
    return d >= 1 && d <= 5 && h >= 9 && h < 16;
  })();

  const backendOnline = health?.status === 'ok';

  const handleManualRefresh = async () => {
    setManualRefreshing(true);
    try {
      await triggerRefresh();
      setTimeout(() => setManualRefreshing(false), 3000);
    } catch {
      setManualRefreshing(false);
    }
  };

  return (
    <header
      className="flex-none h-14 flex items-center justify-between px-4 border-b border-zinc-800"
      style={{ backgroundColor: 'var(--bg-surface)' }}
    >
      {/* Logo + status */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">StockPulse</span>
          <span className="text-xs text-zinc-500 ml-1.5">AI</span>
        </div>

        {/* Market open indicator */}
        <div className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
          <div className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-[10px] text-zinc-500">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
        </div>

        {/* Backend status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800">
          {backendOnline ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-500">Live</span>
              {health?.ai_enabled && (
                <span className="flex items-center gap-0.5 text-[10px] text-indigo-400 ml-1">
                  <Zap className="w-2.5 h-2.5" />AI
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-500">Demo</span>
            </>
          )}
        </div>
      </div>

      {/* Indices */}
      <div className="hidden md:flex items-center gap-2">
        {MARKET_INDICES.map((idx) => (
          <IndexBadge key={idx.name} idx={idx} />
        ))}
      </div>

      {/* Refresh controls */}
      <div className="flex items-center gap-2">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-zinc-500">Updated: {lastUpdated}</div>
          <div className="text-xs text-zinc-700">Next: {mm}:{ss}</div>
        </div>

        {/* Manual refresh */}
        <button
          onClick={handleManualRefresh}
          disabled={manualRefreshing || !backendOnline}
          title="Trigger immediate refresh"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${manualRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${
            isRefreshing || manualRefreshing
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing || manualRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">
            {manualRefreshing ? 'Refreshing…' : isRefreshing ? 'Auto-refresh…' : 'Auto 5m'}
          </span>
        </div>

      </div>
    </header>
  );
}
