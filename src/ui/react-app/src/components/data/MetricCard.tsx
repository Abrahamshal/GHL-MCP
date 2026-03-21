import React from 'react';
import type { MetricCardProps } from '../../types.js';

const metricColorClasses: Record<string, string> = {
  default: '', green: 'metric-green', blue: 'metric-blue', purple: 'metric-purple',
  yellow: 'metric-yellow', red: 'metric-red',
};

const trendClasses: Record<string, string> = { up: 'trend-up', down: 'trend-down', flat: 'trend-flat' };
const trendIcons: Record<string, string> = { up: '↑', down: '↓', flat: '→' };

interface Props extends MetricCardProps {
  children?: React.ReactNode;
}

export const MetricCard: React.FC<Props> = ({ label, value, trend, trendValue, color = 'default' }) => {
  const colorCls = metricColorClasses[color] || '';

  return (
    <div className="metric-card">
      <div className={`metric-value ${colorCls}`}>{value}</div>
      <div className="metric-label">{label}</div>
      {trend && trendValue && (
        <div className={`metric-trend ${trendClasses[trend] || 'trend-flat'}`}>
          {trendIcons[trend] || '→'} {trendValue}
        </div>
      )}
    </div>
  );
};
