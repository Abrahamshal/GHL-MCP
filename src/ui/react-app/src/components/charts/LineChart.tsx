import React from 'react';
import type { LineChartProps } from '../../types.js';

export const LineChart: React.FC<LineChartProps> = ({
  points = [],
  color = '#4f46e5',
  showPoints = true,
  showArea = false,
  title,
  yAxisLabel,
}) => {
  if (points.length === 0) {
    return <div className="chart-container chart-empty">No data</div>;
  }

  const vals = points.map(p => p.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const svgW = Math.max(points.length * 60, 200);
  const svgH = 180;
  const padL = 40;
  const padR = 10;
  const padT = 16;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const pts = points.map((p, i) => {
    const x = padL + (plotW / Math.max(points.length - 1, 1)) * i;
    const y = padT + plotH - ((p.value - minV) / range) * plotH;
    return { x, y, label: p.label, value: p.value };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = showArea
    ? `${linePath} L${pts[pts.length - 1].x},${padT + plotH} L${pts[0].x},${padT + plotH} Z`
    : '';

  // Y-axis ticks (5 ticks)
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const val = minV + (range * i) / 4;
    const y = padT + plotH - (plotH * i) / 4;
    return { val, y };
  });

  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      <div className="chart-scroll">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="line-chart-svg"
          preserveAspectRatio="xMinYMid meet"
        >
          {/* Grid lines + Y-axis labels */}
          {ticks.map((t, i) => (
            <React.Fragment key={i}>
              <line
                x1={padL}
                y1={t.y}
                x2={svgW - padR}
                y2={t.y}
                stroke="#f3f4f6"
                strokeWidth={1}
              />
              <text
                x={padL - 6}
                y={t.y + 3}
                textAnchor="end"
                className="chart-axis-text"
              >
                {Math.round(t.val).toLocaleString()}
              </text>
            </React.Fragment>
          ))}

          {/* Y-axis label */}
          {yAxisLabel && (
            <text
              x={10}
              y={padT + plotH / 2}
              transform={`rotate(-90,10,${padT + plotH / 2})`}
              className="chart-axis-label"
            >
              {yAxisLabel}
            </text>
          )}

          {/* Area fill */}
          {showArea && areaPath && (
            <path d={areaPath} fill={color} opacity={0.1} />
          )}

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {showPoints &&
            pts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={4}
                fill="white"
                stroke={color}
                strokeWidth={2.5}
              />
            ))}

          {/* X-axis labels */}
          {pts.map((p, i) => (
            <text
              key={`label-${i}`}
              x={p.x}
              y={svgH - 6}
              textAnchor="middle"
              className="chart-axis-text"
            >
              {points[i].label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};
