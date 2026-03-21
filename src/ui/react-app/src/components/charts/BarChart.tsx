import React from 'react';
import type { BarChartProps } from '../../types.js';

const COLORS = ['#4f46e5','#7c3aed','#16a34a','#3b82f6','#eab308','#ef4444','#ec4899','#f97316'];

export const BarChart: React.FC<BarChartProps> = ({
  bars = [],
  orientation = 'vertical',
  maxValue,
  showValues = true,
  title,
}) => {
  const max = maxValue || Math.max(...bars.map(b => b.value), 1);

  if (orientation === 'horizontal') {
    return (
      <div className="chart-container">
        {title && <div className="chart-title">{title}</div>}
        <div className="bar-chart-h">
          {bars.map((b, i) => {
            const pct = Math.min(100, (b.value / max) * 100);
            const color = b.color || COLORS[i % COLORS.length];
            return (
              <div className="bar-h-row" key={i}>
                <span className="bar-h-label">{b.label}</span>
                <div className="bar-h-track">
                  <div
                    className="bar-h-fill"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
                {showValues && (
                  <span className="bar-h-value">
                    {Number(b.value).toLocaleString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical bars via SVG
  const svgW = Math.max(bars.length * 60, 200);
  const svgH = 180;
  const padTop = 10;
  const padBot = 30;
  const barW = Math.min(36, (svgW / bars.length) * 0.6);
  const gap = svgW / bars.length;
  const plotH = svgH - padTop - padBot;

  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      <div className="chart-scroll">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="bar-chart-svg"
          preserveAspectRatio="xMinYMid meet"
        >
          <line
            x1={0}
            y1={padTop + plotH}
            x2={svgW}
            y2={padTop + plotH}
            stroke="#e5e7eb"
            strokeWidth={1}
          />
          {bars.map((b, i) => {
            const pct = Math.min(1, b.value / max);
            const h = pct * plotH;
            const x = gap * i + (gap - barW) / 2;
            const y = padTop + plotH - h;
            const color = b.color || COLORS[i % COLORS.length];
            return (
              <React.Fragment key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  rx={4}
                  fill={color}
                  className="bar-v-rect"
                />
                {showValues && (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    className="bar-v-val"
                  >
                    {Number(b.value).toLocaleString()}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={svgH - 6}
                  textAnchor="middle"
                  className="bar-v-label"
                >
                  {b.label}
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
