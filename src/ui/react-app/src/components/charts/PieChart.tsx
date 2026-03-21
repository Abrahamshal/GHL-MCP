import React from 'react';
import type { PieChartProps } from '../../types.js';

const COLORS = ['#4f46e5','#7c3aed','#16a34a','#3b82f6','#eab308','#ef4444','#ec4899','#f97316'];

export const PieChart: React.FC<PieChartProps> = ({
  segments = [],
  donut = false,
  title,
  showLegend = true,
}) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const svgSize = 180;

  let cumAngle = -Math.PI / 2; // start at 12 o'clock

  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const angle = frac * Math.PI * 2;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const color = seg.color || COLORS[i % COLORS.length];

    // Single full segment
    if (frac >= 0.9999) {
      return <circle key={i} cx={cx} cy={cy} r={r} fill={color} />;
    }

    return (
      <path
        key={i}
        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
        fill={color}
      />
    );
  });

  return (
    <div className="chart-container">
      {title && <div className="chart-title">{title}</div>}
      <div className="pie-chart-layout">
        <svg
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="pie-chart-svg"
        >
          {arcs}
          {donut && (
            <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
          )}
          {donut && (
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              className="pie-center-text"
            >
              {total.toLocaleString()}
            </text>
          )}
        </svg>

        {showLegend && (
          <div className="pie-legend">
            {segments.map((seg, i) => {
              const color = seg.color || COLORS[i % COLORS.length];
              const pct = ((seg.value / total) * 100).toFixed(1);
              return (
                <div className="pie-legend-item" key={i}>
                  <span
                    className="pie-legend-dot"
                    style={{ background: color }}
                  />
                  <span className="pie-legend-label">{seg.label}</span>
                  <span className="pie-legend-value">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
