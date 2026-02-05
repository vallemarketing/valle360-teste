'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 200, className }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((point, index) => {
          const barHeight = (point.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-all duration-500 ease-out hover:opacity-80',
                    point.color || 'bg-valle-blue'
                  )}
                  style={{
                    height: `${barHeight}%`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                  title={`${point.label}: ${point.value}`}
                />
              </div>
              <span className="text-xs text-foreground/60 text-center">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
}

export function LineChart({ data, height = 200, className }: LineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const width = 100 / (data.length - 1);

  const points = data.map((point, index) => {
    const x = index * width;
    const y = 100 - (point.value / maxValue) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ height }}
        className="w-full"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-valle-blue"
        />
        {data.map((point, index) => {
          const x = index * width;
          const y = 100 - (point.value / maxValue) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              className="fill-valle-blue"
            />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2">
        {data.map((point, index) => (
          <span key={index} className="text-xs text-foreground/60">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
