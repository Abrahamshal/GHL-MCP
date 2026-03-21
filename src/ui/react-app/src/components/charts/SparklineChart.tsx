import React from 'react';
import type { SparklineChartProps } from '../../types.js';

export const SparklineChart: React.FC<SparklineChartProps> = ({
  values = [],
  color = '#4f46e5',
  height = 24,
  width = 80,
}) => {
  if (values.length < 2) {
    return (
      <span
        className="sparkline-empty"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        —
      </span>
    );
  }

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pad = 2;

  const pts = values
    .map((v, i) => {
      const x = pad + ((width - pad * 2) / (values.length - 1)) * i;
      const y =
        pad + (height - pad * 2) - ((v - minV) / range) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      className="sparkline-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
