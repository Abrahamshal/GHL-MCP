/**
 * Chart Components for GHL Dynamic View
 * Pure CSS/SVG charts — no external libraries
 */

type ChartFn = (props: any, children: string) => string;

function esc(s: unknown): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const chartPalette = ['#4f46e5', '#7c3aed', '#16a34a', '#3b82f6', '#eab308', '#ef4444', '#ec4899', '#f97316'];

export const BarChart: ChartFn = (props) => {
  const {
    bars = [], orientation = 'vertical', maxValue, showValues = true, title,
  } = props;
  const max = maxValue || Math.max(...bars.map((b: any) => b.value), 1);

  if (orientation === 'horizontal') {
    return `
      <div class="chart-container">
        ${title ? `<div class="chart-title">${esc(title)}</div>` : ''}
        <div class="bar-chart-h">
          ${bars.map((b: any, i: number) => {
            const pct = Math.min(100, (b.value / max) * 100);
            const color = b.color || chartPalette[i % chartPalette.length];
            return `
              <div class="bar-h-row">
                <span class="bar-h-label">${esc(b.label)}</span>
                <div class="bar-h-track">
                  <div class="bar-h-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                ${showValues ? `<span class="bar-h-value">${Number(b.value).toLocaleString()}</span>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  // Vertical bars via SVG
  const svgW = Math.max(bars.length * 60, 200);
  const svgH = 180;
  const padTop = 10;
  const padBot = 30;
  const barW = Math.min(36, (svgW / bars.length) * 0.6);
  const gap = svgW / bars.length;
  const plotH = svgH - padTop - padBot;

  const barsSvg = bars.map((b: any, i: number) => {
    const pct = Math.min(1, b.value / max);
    const h = pct * plotH;
    const x = gap * i + (gap - barW) / 2;
    const y = padTop + plotH - h;
    const color = b.color || chartPalette[i % chartPalette.length];
    return `
      <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="4" fill="${color}" class="bar-v-rect"/>
      ${showValues ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" class="bar-v-val">${Number(b.value).toLocaleString()}</text>` : ''}
      <text x="${x + barW / 2}" y="${svgH - 6}" text-anchor="middle" class="bar-v-label">${esc(b.label)}</text>`;
  }).join('');

  return `
    <div class="chart-container">
      ${title ? `<div class="chart-title">${esc(title)}</div>` : ''}
      <div class="chart-scroll">
        <svg viewBox="0 0 ${svgW} ${svgH}" class="bar-chart-svg" preserveAspectRatio="xMinYMid meet">
          <line x1="0" y1="${padTop + plotH}" x2="${svgW}" y2="${padTop + plotH}" stroke="#e5e7eb" stroke-width="1"/>
          ${barsSvg}
        </svg>
      </div>
    </div>`;
};

export const LineChart: ChartFn = (props) => {
  const {
    points = [], color = '#4f46e5', showPoints = true, showArea = false, title, yAxisLabel,
  } = props;
  if (points.length === 0) return '<div class="chart-container chart-empty">No data</div>';

  const vals = points.map((p: any) => p.value);
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

  const pts = points.map((p: any, i: number) => {
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

  return `
    <div class="chart-container">
      ${title ? `<div class="chart-title">${esc(title)}</div>` : ''}
      <div class="chart-scroll">
        <svg viewBox="0 0 ${svgW} ${svgH}" class="line-chart-svg" preserveAspectRatio="xMinYMid meet">
          ${ticks.map(t => `
            <line x1="${padL}" y1="${t.y}" x2="${svgW - padR}" y2="${t.y}" stroke="#f3f4f6" stroke-width="1"/>
            <text x="${padL - 6}" y="${t.y + 3}" text-anchor="end" class="chart-axis-text">${Math.round(t.val).toLocaleString()}</text>
          `).join('')}
          ${yAxisLabel ? `<text x="10" y="${padT + plotH / 2}" transform="rotate(-90,10,${padT + plotH / 2})" class="chart-axis-label">${esc(yAxisLabel)}</text>` : ''}
          ${showArea ? `<path d="${areaPath}" fill="${color}" opacity="0.1"/>` : ''}
          <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          ${showPoints ? pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="white" stroke="${color}" stroke-width="2.5"/>`).join('') : ''}
          ${pts.map((p, i) => `<text x="${p.x}" y="${svgH - 6}" text-anchor="middle" class="chart-axis-text">${esc(points[i].label)}</text>`).join('')}
        </svg>
      </div>
    </div>`;
};

export const PieChart: ChartFn = (props) => {
  const {
    segments = [], donut = false, title, showLegend = true,
  } = props;
  const total = segments.reduce((s: number, seg: any) => s + seg.value, 0) || 1;
  const r = 70;
  const cx = 90;
  const cy = 90;
  const svgSize = 180;

  let cumAngle = -Math.PI / 2; // start at 12 o'clock
  const arcs = segments.map((seg: any, i: number) => {
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
    const color = seg.color || chartPalette[i % chartPalette.length];

    // Single full segment
    if (frac >= 0.9999) {
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
    }

    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z" fill="${color}"/>`;
  });

  const donutHole = donut
    ? `<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="white"/>`
    : '';

  const legendHtml = showLegend ? `
    <div class="pie-legend">
      ${segments.map((seg: any, i: number) => {
        const color = seg.color || chartPalette[i % chartPalette.length];
        const pct = ((seg.value / total) * 100).toFixed(1);
        return `<div class="pie-legend-item"><span class="pie-legend-dot" style="background:${color}"></span><span class="pie-legend-label">${esc(seg.label)}</span><span class="pie-legend-value">${pct}%</span></div>`;
      }).join('')}
    </div>` : '';

  return `
    <div class="chart-container">
      ${title ? `<div class="chart-title">${esc(title)}</div>` : ''}
      <div class="pie-chart-layout">
        <svg viewBox="0 0 ${svgSize} ${svgSize}" class="pie-chart-svg">
          ${arcs.join('')}
          ${donutHole}
          ${donut ? `<text x="${cx}" y="${cy + 5}" text-anchor="middle" class="pie-center-text">${total.toLocaleString()}</text>` : ''}
        </svg>
        ${legendHtml}
      </div>
    </div>`;
};

export const FunnelChart: ChartFn = (props) => {
  const {
    stages = [], showDropoff = true, title,
  } = props;
  if (stages.length === 0) return '<div class="chart-container chart-empty">No data</div>';

  const maxVal = stages[0]?.value || 1;

  return `
    <div class="chart-container">
      ${title ? `<div class="chart-title">${esc(title)}</div>` : ''}
      <div class="funnel-chart">
        ${stages.map((s: any, i: number) => {
          const pct = Math.max(20, (s.value / maxVal) * 100);
          const color = s.color || chartPalette[i % chartPalette.length];
          const dropoff = i > 0
            ? (((stages[i - 1].value - s.value) / stages[i - 1].value) * 100).toFixed(1)
            : null;
          return `
            <div class="funnel-stage">
              <div class="funnel-label-col">
                <span class="funnel-label">${esc(s.label)}</span>
                <span class="funnel-value">${Number(s.value).toLocaleString()}</span>
              </div>
              <div class="funnel-bar-col">
                <div class="funnel-bar" style="width:${pct}%;background:${color}"></div>
              </div>
              ${showDropoff && dropoff !== null ? `<span class="funnel-dropoff">-${dropoff}%</span>` : '<span class="funnel-dropoff"></span>'}
            </div>`;
        }).join('')}
      </div>
    </div>`;
};

export const SparklineChart: ChartFn = (props) => {
  const {
    values = [], color = '#4f46e5', height = 24, width = 80,
  } = props;
  if (values.length < 2) {
    return `<span class="sparkline-empty" style="width:${width}px;height:${height}px">\u2014</span>`;
  }

  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const pad = 2;

  const pts = values.map((v: number, i: number) => {
    const x = pad + ((width - pad * 2) / (values.length - 1)) * i;
    const y = pad + (height - pad * 2) - ((v - minV) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  return `<svg class="sparkline-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
};
