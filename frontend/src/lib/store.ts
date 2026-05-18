'use client';

import { create } from 'zustand';
import type { Timeframe } from '@/types';

interface DashboardStore {
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  activeTimeframe: Timeframe;
  setActiveTimeframe: (tf: Timeframe) => void;
  showTechnicalView: boolean;
  toggleTechnicalView: () => void;
  lastRefreshed: Date;
  setLastRefreshed: (d: Date) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedTicker: 'NVDA',
  setSelectedTicker: (ticker) => set({ selectedTicker: ticker }),
  activeTimeframe: '1M',
  setActiveTimeframe: (tf) => set({ activeTimeframe: tf }),
  showTechnicalView: false,
  toggleTechnicalView: () => set((s) => ({ showTechnicalView: !s.showTechnicalView })),
  lastRefreshed: new Date(),
  setLastRefreshed: (d) => set({ lastRefreshed: d }),
}));
