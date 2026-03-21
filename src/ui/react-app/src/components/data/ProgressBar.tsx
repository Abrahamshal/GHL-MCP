import React from 'react';
import type { ProgressBarProps } from '../../types.js';

const barColorClasses: Record<string, string> = {
  green: 'bar-green', blue: 'bar-blue', purple: 'bar-purple',
  yellow: 'bar-yellow', red: 'bar-red',
};

interface Props extends ProgressBarProps {
  children?: React.ReactNode;
}

export const ProgressBar: React.FC<Props> = ({
  label, value, max = 100, color = 'blue', showPercent = true,
  benchmark, benchmarkLabel,
}) => {
  const pct = Math.min(100, (value / max) * 100);
  const colorCls = barColorClasses[color] || 'bar-blue';

  return (
    <div className="progress-wrap">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">
          <strong>{Number(value).toLocaleString()}</strong>
          {max !== 100 ? ` / ${Number(max).toLocaleString()}` : ''}
          {showPercent ? ` (${pct.toFixed(1)}%)` : ''}
        </span>
      </div>
      <div className="progress-track">
        <div className={`progress-bar ${colorCls}`} style={{ width: `${pct}%` }} />
        {benchmark !== undefined && (
          <>
            <div
              className="progress-benchmark"
              style={{ left: `${(benchmark / max) * 100}%` }}
            />
            {benchmarkLabel && (
              <span
                className="progress-benchmark-label"
                style={{ left: `${(benchmark / max) * 100}%` }}
              >
                {benchmarkLabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
