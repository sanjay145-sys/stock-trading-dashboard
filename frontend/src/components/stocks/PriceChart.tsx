'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import type { CandleData, Timeframe } from '@/types';

interface PriceChartProps {
  candles: CandleData[];
  ticker: string;
  timeframe: Timeframe;
}

const TIMEFRAME_BARS: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 5,
  '1M': 22,
  '3M': 66,
  '1Y': 252,
};

export default function PriceChart({ candles, ticker, timeframe }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const [crosshairData, setCrosshairData] = useState<{
    price?: number;
    change?: number;
    date?: string;
  }>({});

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    const chart = createChart(container, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#71717a',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#18181b', style: 1 },
        horzLines: { color: '#18181b', style: 1 },
      },
      crosshair: {
        vertLine: { color: '#6366f1', width: 1, style: 2, labelBackgroundColor: '#6366f1' },
        horzLine: { color: '#6366f1', width: 1, style: 2, labelBackgroundColor: '#6366f1' },
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: false,
        rightOffset: 3,
      },
      width: container.offsetWidth,
      height: container.offsetHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#34d399',
      downColor: '#f87171',
      borderUpColor: '#34d399',
      borderDownColor: '#f87171',
      wickUpColor: '#34d399',
      wickDownColor: '#f87171',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#6366f180',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const barsToShow = TIMEFRAME_BARS[timeframe];
    const slicedCandles = candles.slice(-barsToShow * 2 || -candles.length);
    const lastN = slicedCandles.slice(-Math.min(barsToShow * 1.5, slicedCandles.length));

    candleSeries.setData(
      lastN.map((c) => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close }))
    );
    volumeSeries.setData(
      lastN.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? '#34d39930' : '#f8717130',
      }))
    );

    chart.timeScale().fitContent();

    chart.subscribeCrosshairMove((param) => {
      if (param.point && param.seriesData.size > 0) {
        const bar = param.seriesData.get(candleSeries) as
          | { open: number; close: number; high: number; low: number }
          | undefined;
        if (bar) {
          const first = lastN[0];
          const refPrice = first?.close ?? bar.close;
          setCrosshairData({
            price: bar.close,
            change: ((bar.close - refPrice) / refPrice) * 100,
            date: typeof param.time === 'string' ? param.time : undefined,
          });
        }
      } else {
        setCrosshairData({});
      }
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (container) {
        chart.resize(container.offsetWidth, container.offsetHeight);
      }
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [candles, timeframe, ticker]);

  return (
    <div className="relative w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />
      {crosshairData.price && (
        <div className="absolute top-2 left-2 flex items-center gap-3 bg-zinc-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
          <span className="text-zinc-400">{crosshairData.date}</span>
          <span className="font-bold text-zinc-100">${crosshairData.price.toFixed(2)}</span>
          {crosshairData.change !== undefined && (
            <span className={crosshairData.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {crosshairData.change >= 0 ? '+' : ''}{crosshairData.change.toFixed(2)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
