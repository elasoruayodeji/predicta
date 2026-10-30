// ============================================================
// Professional Candlestick Chart — TradingView Lightweight Charts
// ============================================================
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickData, Time, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { PriceRecord } from '../../types';

interface CandlestickChartProps {
  data: PriceRecord[];
  height?: number;
  showVolume?: boolean;
  showMA?: boolean;
  maPeriods?: number[];
}

export function CandlestickChart({ 
  data, 
  height = 500, 
  showVolume = true,
  showMA = true,
  maPeriods = [20, 50]
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const maSeriesRefs = useRef<Map<number, ISeriesApi<'Line'>>>(new Map());

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#111318' },
        textColor: '#9ba1ab',
      },
      grid: {
        vertLines: { color: '#2a2d35' },
        horzLines: { color: '#2a2d35' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
      },
      timeScale: {
        borderColor: '#2a2d35',
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2d35',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Prepare candlestick data
    const candleData: CandlestickData[] = data.map(p => ({
      time: p.date as Time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));

    candlestickSeries.setData(candleData);

    // Add volume histogram
    if (showVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#3b82f6',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      const volumeData = data.map(p => ({
        time: p.date as Time,
        value: p.volume,
        color: p.close >= p.open ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
      }));

      volumeSeries.setData(volumeData);
      volumeSeriesRef.current = volumeSeries;
    }

    // Add moving averages
    if (showMA) {
      const colors = ['#f59e0b', '#8b5cf6', '#ec4899'];
      
      maPeriods.forEach((period, idx) => {
        if (data.length >= period) {
          const maSeries = chart.addSeries(LineSeries, {
            color: colors[idx % colors.length],
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
          });

          const maData: { time: Time; value: number }[] = [];
          for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
              sum += data[i - j].close;
            }
            maData.push({
              time: data[i].date as Time,
              value: sum / period,
            });
          }

          maSeries.setData(maData);
          maSeriesRefs.current.set(period, maSeries);
        }
      });
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data, height, showVolume, showMA, maPeriods]);

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full" />
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-secondary)]">
          <p className="text-[var(--color-text-muted)]">No data available</p>
        </div>
      )}
    </div>
  );
}
