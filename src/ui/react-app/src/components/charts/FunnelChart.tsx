import React from 'react';
import type { FunnelChartProps } from '../../types.js';

const COLORS = ['#4f46e5','#7c3aed','#16a34a','#3b82f6','#eab308','#ef4444','#ec4899','#f97316'];

export const FunnelChart: React.FC<FunnelChartProps> = ({
  stages = [],
  showDropoff = true,
  title,
}) => {
  if (stages.length === 0) {
    return <div className="chart-container chart-empty">No data</div>;
  }

  const maxVal = stages[0]?.value || 1;

  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      <div className="funnel-chart">
        {stages.map((s, i) => {
          const pct = Math.max(20, (s.value / maxVal) * 100);
          const color = s.color || COLORS[i % COLORS.length];
          const dropoff =
            i > 0
              ? (
                  ((stages[i - 1].value - s.value) / stages[i - 1].value) *
                  100
                ).toFixed(1)
              : null;
          return (
            <div className="funnel-stage" key={i}>
              <div className="funnel-label-col">
                <span className="funnel-label">{s.label}</span>
                <span className="funnel-value">
                  {Number(s.value).toLocaleString()}
                </span>
              </div>
              <div className="funnel-bar-col">
                <div
                  className="funnel-bar"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              {showDropoff && dropoff !== null ? (
                <span className="funnel-dropoff">-{dropoff}%</span>
              ) : (
                <span className="funnel-dropoff" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
