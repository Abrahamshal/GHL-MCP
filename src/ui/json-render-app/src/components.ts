/**
 * GHL Component Library - Vanilla JS Template Functions
 * All 20 components ported from React spike to HTML string renderers.
 */

import { BarChart, LineChart, PieChart, FunnelChart, SparklineChart } from './charts';

// ─── Utility helpers ────────────────────────────────────────

function esc(s: unknown): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtCurrency(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

const avatarColors = ['#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
function getAvatarColor(name: string): string {
  return avatarColors[(name || '').charCodeAt(0) % avatarColors.length];
}
function getInitials(name: string): string {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Status/Variant Color Maps ──────────────────────────────

const statusColors: Record<string, string> = {
  active: 'status-active', complete: 'status-complete', paused: 'status-paused',
  draft: 'status-draft', error: 'status-error', sent: 'status-sent',
  paid: 'status-paid', pending: 'status-pending', open: 'status-open',
  won: 'status-won', lost: 'status-lost', abandoned: 'status-draft',
};

const trendIcons: Record<string, string> = { up: '↑', down: '↓', flat: '→' };
const trendClasses: Record<string, string> = { up: 'trend-up', down: 'trend-down', flat: 'trend-flat' };

const metricColorClasses: Record<string, string> = {
  default: '', green: 'metric-green', blue: 'metric-blue', purple: 'metric-purple',
  yellow: 'metric-yellow', red: 'metric-red',
};

const barColorClasses: Record<string, string> = {
  green: 'bar-green', blue: 'bar-blue', purple: 'bar-purple', yellow: 'bar-yellow', red: 'bar-red',
};

const iconMap: Record<string, string> = {
  email: '📧', phone: '📞', note: '📝', meeting: '📅', task: '✅', system: '⚙️',
};

const variantBorderClasses: Record<string, string> = {
  default: 'tl-border-default', success: 'tl-border-success',
  warning: 'tl-border-warning', error: 'tl-border-error',
};

const btnVariantClasses: Record<string, string> = {
  primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost',
};

const btnSizeClasses: Record<string, string> = {
  sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg',
};

// ─── Component Type ─────────────────────────────────────────

type ComponentFn = (props: any, children: string) => string;

// ─── Layout Components ──────────────────────────────────────

const PageHeader: ComponentFn = (props, children) => {
  const { title, subtitle, status, statusVariant, gradient, stats } = props;
  const statusCls = statusColors[statusVariant || 'active'] || 'status-active';

  if (gradient) {
    return `
      <div class="page-header-gradient">
        <div class="page-header-top">
          <div>
            <h1 class="page-header-title-light">${esc(title)}</h1>
            ${subtitle ? `<p class="page-header-subtitle-light">${esc(subtitle)}</p>` : ''}
          </div>
          ${status ? `<span class="badge-light">${esc(status)}</span>` : ''}
        </div>
        ${stats && stats.length > 0 ? `
          <div class="page-header-stats-light">
            ${stats.map((s: any) => `
              <span class="stat-item-light"><span class="stat-value-light">${esc(s.value)}</span> <span class="stat-label-light">${esc(s.label)}</span></span>
            `).join('')}
          </div>` : ''}
        ${children}
      </div>`;
  }

  return `
    <div class="page-header">
      <div class="page-header-top">
        <div>
          <h1 class="page-header-title">${esc(title)}</h1>
          ${subtitle ? `<p class="page-header-subtitle">${esc(subtitle)}</p>` : ''}
        </div>
        ${status ? `<span class="status-badge ${statusCls}">${esc(status)}</span>` : ''}
      </div>
      ${stats && stats.length > 0 ? `
        <div class="page-header-stats">
          ${stats.map((s: any) => `<span class="stat-item"><span class="stat-value">${esc(s.value)}</span> ${esc(s.label)}</span>`).join('')}
        </div>` : ''}
      ${children}
    </div>`;
};

const Card: ComponentFn = (props, children) => {
  const { title, subtitle, padding = 'md', noBorder } = props;
  const padCls = ({ none: 'p-0', sm: 'p-sm', md: 'p-md', lg: 'p-lg' } as Record<string, string>)[padding] || 'p-md';
  return `
    <div class="card ${noBorder ? 'no-border' : ''}">
      ${title ? `<div class="card-header"><h2 class="card-title">${esc(title)}</h2>${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ''}</div>` : ''}
      <div class="card-body ${padCls}">${children}</div>
    </div>`;
};

const StatsGrid: ComponentFn = (props, children) => {
  const cols = props.columns || 3;
  return `<div class="stats-grid stats-grid-${cols}">${children}</div>`;
};

const SplitLayout: ComponentFn = (props, children) => {
  const ratio = props.ratio || '50/50';
  const gap = props.gap || 'md';
  const ratioCls = ({ '50/50': 'split-50-50', '33/67': 'split-33-67', '67/33': 'split-67-33' } as Record<string, string>)[ratio] || 'split-50-50';
  const gapCls = ({ sm: 'gap-sm', md: 'gap-md', lg: 'gap-lg' } as Record<string, string>)[gap] || 'gap-md';
  return `<div class="split-layout ${ratioCls} ${gapCls}">${children}</div>`;
};

const Section: ComponentFn = (props, children) => {
  const { title, description } = props;
  return `
    <div class="section">
      ${title ? `<div class="section-header"><h2 class="section-title">${esc(title)}</h2>${description ? `<p class="section-desc">${esc(description)}</p>` : ''}</div>` : ''}
      ${children}
    </div>`;
};

// ─── Data Display Components ────────────────────────────────

function formatCell(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '<span class="text-muted">—</span>';
  switch (format) {
    case 'email':
      return `<a href="mailto:${esc(value)}" class="link">${esc(value)}</a>`;
    case 'phone':
      return `<span class="text-secondary">${esc(value)}</span>`;
    case 'date':
      return `<span class="text-sm text-secondary">${esc(value)}</span>`;
    case 'currency':
      return `<span class="font-mono font-medium">${esc(value)}</span>`;
    case 'tags': {
      const tags = Array.isArray(value) ? value : [value];
      const visible = tags.slice(0, 3);
      return `<div class="tags">${visible.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${tags.length > 3 ? `<span class="tag tag-more">+${tags.length - 3}</span>` : ''}</div>`;
    }
    case 'avatar': {
      const name = String(value);
      const color = getAvatarColor(name);
      return `<div class="avatar-cell"><div class="avatar" style="background:${color}">${getInitials(name)}</div><span class="font-medium">${esc(name)}</span></div>`;
    }
    case 'status': {
      const s = String(value).toLowerCase();
      const cls = s.includes('active') ? 'status-complete' : s.includes('new') ? 'status-active' : s.includes('lost') ? 'status-error' : 'status-draft';
      return `<span class="status-badge ${cls}">${esc(value)}</span>`;
    }
    default:
      return `<span>${esc(value)}</span>`;
  }
}

const DataTable: ComponentFn = (props) => {
  const { columns = [], rows = [], selectable, emptyMessage, pageSize = 10 } = props;
  if (rows.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">📋</div><p>${esc(emptyMessage || 'No data available')}</p></div>`;
  }
  const displayRows = rows.slice(0, pageSize);
  const totalPages = Math.ceil(rows.length / pageSize);
  return `
    <div class="data-table-wrap">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              ${selectable ? '<th class="checkbox-col"><input type="checkbox" /></th>' : ''}
              ${columns.map((col: any) => `
                <th class="${col.sortable ? 'sortable' : ''}" ${col.width ? `style="width:${col.width}"` : ''}>
                  ${esc(col.label)}
                </th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${displayRows.map((row: any) => `
              <tr data-row-id="${esc(row.id || '')}" data-interactive="true" class="clickable-row" title="Double-click to view details">
                ${selectable ? '<td class="checkbox-col"><input type="checkbox" /></td>' : ''}
                ${columns.map((col: any) => `<td>${formatCell(row[col.key], col.format)}</td>`).join('')}
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? `
        <div class="table-pagination">
          <span class="pagination-info">1–${displayRows.length} of ${rows.length}</span>
          <div class="pagination-buttons">
            <button class="btn btn-secondary btn-sm" disabled>Previous</button>
            <button class="btn btn-secondary btn-sm">Next</button>
          </div>
        </div>` : ''}
    </div>`;
};

const KanbanBoard: ComponentFn = (props) => {
  const { columns = [] } = props;
  const kanbanStatusClasses: Record<string, string> = {
    open: 'status-open', won: 'status-won', lost: 'status-lost', abandoned: 'status-draft',
  };
  return `
    <div class="kanban-wrap">
      <div class="kanban-cols">
        ${columns.map((col: any) => `
          <div class="kanban-col" data-stage-id="${esc(col.id || '')}" data-droppable="true">
            <div class="kanban-col-header">
              <div class="kanban-col-title-row">
                <span class="kanban-col-title">${esc(col.title)}</span>
                <span class="kanban-col-count" data-count-for="${esc(col.id || '')}">${col.count ?? col.cards?.length ?? 0}</span>
              </div>
              ${col.totalValue ? `<div class="kanban-col-value">${esc(col.totalValue)}</div>` : ''}
            </div>
            <div class="kanban-col-body" data-stage-id="${esc(col.id || '')}">
              ${(!col.cards || col.cards.length === 0) ? '<div class="kanban-empty">No items</div>' :
                col.cards.map((card: any) => `
                  <div class="kanban-card" draggable="true"
                       data-card-id="${esc(card.id || '')}"
                       data-stage-id="${esc(col.id || '')}"
                       data-interactive="true"
                       title="Drag to move • Double-click to edit">
                    <div class="kanban-card-title">${esc(card.title)}</div>
                    ${card.subtitle ? `<div class="kanban-card-subtitle">${card.avatarInitials ? `<div class="kanban-avatar">${esc(card.avatarInitials)}</div>` : ''}${esc(card.subtitle)}</div>` : ''}
                    ${card.value ? `<div class="kanban-card-value">${esc(card.value)}</div>` : ''}
                    <div class="kanban-card-footer">
                      ${card.date ? `<span>${esc(card.date)}</span>` : '<span></span>'}
                      ${card.status ? `<span class="status-badge-sm ${kanbanStatusClasses[card.statusVariant || 'open'] || 'status-open'}">${esc(card.status)}</span>` : ''}
                    </div>
                  </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
};

const MetricCard: ComponentFn = (props) => {
  const { label, value, trend, trendValue, color = 'default' } = props;
  const colorCls = metricColorClasses[color] || '';
  return `
    <div class="metric-card">
      <div class="metric-value ${colorCls}">${esc(value)}</div>
      <div class="metric-label">${esc(label)}</div>
      ${trend && trendValue ? `<div class="metric-trend ${trendClasses[trend] || 'trend-flat'}">${trendIcons[trend] || '→'} ${esc(trendValue)}</div>` : ''}
    </div>`;
};

const StatusBadge: ComponentFn = (props) => {
  const { label, variant } = props;
  const cls = statusColors[variant] || 'status-active';
  return `<span class="status-badge ${cls}">${esc(label)}</span>`;
};

const Timeline: ComponentFn = (props) => {
  const { events = [] } = props;
  return `
    <div class="timeline">
      <div class="timeline-line"></div>
      ${events.map((e: any) => `
        <div class="timeline-item">
          <div class="timeline-dot ${variantBorderClasses[e.variant || 'default'] || 'tl-border-default'}">${iconMap[e.icon || 'system'] || '•'}</div>
          <div class="timeline-content">
            <div class="timeline-title">${esc(e.title)}</div>
            ${e.description ? `<div class="timeline-desc">${esc(e.description)}</div>` : ''}
            <div class="timeline-time">${esc(e.timestamp)}</div>
          </div>
        </div>`).join('')}
    </div>`;
};

const ProgressBar: ComponentFn = (props) => {
  const { label, value, max = 100, color = 'blue', showPercent = true, benchmark, benchmarkLabel } = props;
  const pct = Math.min(100, (value / max) * 100);
  const colorCls = barColorClasses[color] || 'bar-blue';
  return `
    <div class="progress-wrap">
      <div class="progress-header">
        <span class="progress-label">${esc(label)}</span>
        <span class="progress-value"><strong>${Number(value).toLocaleString()}</strong>${max !== 100 ? ` / ${Number(max).toLocaleString()}` : ''}${showPercent ? ` (${pct.toFixed(1)}%)` : ''}</span>
      </div>
      <div class="progress-track">
        <div class="progress-bar ${colorCls}" style="width:${pct}%"></div>
        ${benchmark !== undefined ? `<div class="progress-benchmark" style="left:${(benchmark / max) * 100}%"></div>${benchmarkLabel ? `<span class="progress-benchmark-label" style="left:${(benchmark / max) * 100}%">${esc(benchmarkLabel)}</span>` : ''}` : ''}
      </div>
    </div>`;
};

// ─── Detail View Components ─────────────────────────────────

const DetailHeader: ComponentFn = (props, children) => {
  const { title, subtitle, entityId, status, statusVariant } = props;
  const cls = statusColors[statusVariant || 'active'] || 'status-active';
  return `
    <div class="detail-header">
      <div class="detail-header-top">
        <div>
          <h1 class="detail-title">${esc(title)}</h1>
          ${entityId ? `<p class="detail-entity-id">${esc(entityId)}</p>` : ''}
          ${subtitle ? `<p class="detail-subtitle">${esc(subtitle)}</p>` : ''}
        </div>
        ${status ? `<span class="status-badge ${cls}">${esc(status)}</span>` : ''}
      </div>
      ${children}
    </div>`;
};

const KeyValueList: ComponentFn = (props) => {
  const { items = [], compact } = props;
  return `
    <div class="kv-list">
      ${items.map((item: any) => {
        const isTotalRow = item.isTotalRow;
        let rowCls = 'kv-row';
        if (isTotalRow) rowCls += ' kv-total';
        else if (item.variant === 'success') rowCls += ' kv-success';
        else if (item.variant === 'highlight') rowCls += ' kv-highlight';
        else if (item.variant === 'muted') rowCls += ' kv-muted';
        if (compact) rowCls += ' kv-compact';
        const valueCls = isTotalRow ? 'kv-value-total' : item.bold ? 'kv-value-bold' : item.variant === 'danger' ? 'kv-value-danger' : item.variant === 'success' ? 'kv-value-success' : 'kv-value';
        return `<div class="${rowCls}"><span class="kv-label">${esc(item.label)}</span><span class="${valueCls}">${esc(item.value)}</span></div>`;
      }).join('')}
    </div>`;
};

const LineItemsTable: ComponentFn = (props) => {
  const { items = [], currency = 'USD' } = props;
  return `
    <div class="line-items-wrap">
      <table class="line-items-table">
        <thead>
          <tr>
            <th class="text-left">Item</th>
            <th class="text-center">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td><div class="font-medium">${esc(item.name)}</div>${item.description ? `<div class="text-sm text-secondary">${esc(item.description)}</div>` : ''}</td>
              <td class="text-center text-secondary">${item.quantity}</td>
              <td class="text-right font-mono">${fmtCurrency(item.unitPrice, currency)}</td>
              <td class="text-right font-mono">${fmtCurrency(item.total, currency)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
};

const InfoBlock: ComponentFn = (props) => {
  const { label, name, lines = [] } = props;
  return `
    <div class="info-block">
      <h3 class="info-block-label">${esc(label)}</h3>
      <div class="info-block-name">${esc(name)}</div>
      <div class="info-block-lines">${lines.map((l: string) => `<div>${esc(l)}</div>`).join('')}</div>
    </div>`;
};

// ─── Interactive Components ─────────────────────────────────

const SearchBar: ComponentFn = (props) => {
  const { placeholder = 'Search...' } = props;
  return `
    <div class="search-bar">
      <input type="text" class="search-input" placeholder="${esc(placeholder)}" />
    </div>`;
};

const FilterChips: ComponentFn = (props) => {
  const { chips = [] } = props;
  return `
    <div class="filter-chips">
      ${chips.map((c: any) => `<button class="chip ${c.active ? 'chip-active' : ''}">${esc(c.label)}</button>`).join('')}
    </div>`;
};

const TabGroup: ComponentFn = (props) => {
  const { tabs = [], activeTab } = props;
  const active = activeTab || tabs[0]?.value;
  return `
    <div class="tab-group">
      ${tabs.map((t: any) => `
        <button class="tab ${t.value === active ? 'tab-active' : ''}">
          ${esc(t.label)}${t.count !== undefined ? `<span class="tab-count">${t.count}</span>` : ''}
        </button>`).join('')}
    </div>`;
};

// ─── Action Components ──────────────────────────────────────

const ActionButton: ComponentFn = (props) => {
  const { label, variant = 'secondary', size = 'md', disabled } = props;
  const vCls = btnVariantClasses[variant] || 'btn-secondary';
  const sCls = btnSizeClasses[size] || 'btn-md';
  return `<button class="btn ${vCls} ${sCls}" ${disabled ? 'disabled' : ''}>${esc(label)}</button>`;
};

const ActionBar: ComponentFn = (props, children) => {
  const { align = 'right' } = props;
  const alignCls = ({ left: 'align-left', center: 'align-center', right: 'align-right' } as Record<string, string>)[align] || 'align-right';
  return `<div class="action-bar ${alignCls}">${children}</div>`;
};

// ─── Data Display Components (Extended) ─────────────────────

const currencySizeClasses: Record<string, string> = { sm: 'currency-sm', md: 'currency-md', lg: 'currency-lg' };

const CurrencyDisplay: ComponentFn = (props) => {
  const { amount, currency = 'USD', locale = 'en-US', size = 'md', positive, negative } = props;
  const sizeCls = currencySizeClasses[size] || 'currency-md';
  let colorCls = '';
  if (positive) colorCls = 'currency-positive';
  else if (negative) colorCls = 'currency-negative';
  else if (amount > 0) colorCls = 'currency-positive';
  else if (amount < 0) colorCls = 'currency-negative';
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    formatted = `$${Number(amount).toFixed(2)}`;
  }
  return `<span class="currency-display ${sizeCls} ${colorCls}">${esc(formatted)}</span>`;
};

const tagColorMap: Record<string, string> = {
  blue: 'tag-pill-blue', green: 'tag-pill-green', red: 'tag-pill-red',
  yellow: 'tag-pill-yellow', purple: 'tag-pill-purple', gray: 'tag-pill-gray',
  indigo: 'tag-pill-indigo', pink: 'tag-pill-pink',
};

const TagList: ComponentFn = (props) => {
  const { tags = [], maxVisible, size = 'md' } = props;
  const visible = maxVisible ? tags.slice(0, maxVisible) : tags;
  const remaining = maxVisible ? tags.length - maxVisible : 0;
  const sizeCls = size === 'sm' ? 'tag-list-sm' : 'tag-list-md';
  return `
    <div class="tag-list ${sizeCls}">
      ${visible.map((t: any) => {
        const label = typeof t === 'string' ? t : t.label;
        const color = (typeof t === 'object' && t.color) || 'blue';
        const variant = (typeof t === 'object' && t.variant) || 'filled';
        const colorCls = tagColorMap[color] || 'tag-pill-blue';
        const variantCls = variant === 'outlined' ? 'tag-pill-outlined' : '';
        return `<span class="tag-pill ${colorCls} ${variantCls}">${esc(label)}</span>`;
      }).join('')}
      ${remaining > 0 ? `<span class="tag-pill tag-pill-more">+${remaining}</span>` : ''}
    </div>`;
};

const CardGrid: ComponentFn = (props) => {
  const { cards = [], columns = 3 } = props;
  const cardStatusClasses: Record<string, string> = {
    active: 'cg-status-active', complete: 'cg-status-complete', draft: 'cg-status-draft',
    error: 'cg-status-error', pending: 'cg-status-pending',
  };
  return `
    <div class="card-grid card-grid-${columns}">
      ${cards.map((c: any) => `
        <div class="card-grid-item">
          ${c.imageUrl ? `<div class="card-grid-image" style="background-image:url('${esc(c.imageUrl)}')"></div>` : `<div class="card-grid-image card-grid-image-placeholder"><span>📄</span></div>`}
          <div class="card-grid-body">
            <div class="card-grid-title">${esc(c.title)}</div>
            ${c.subtitle ? `<div class="card-grid-subtitle">${esc(c.subtitle)}</div>` : ''}
            ${c.description ? `<div class="card-grid-desc">${esc(c.description)}</div>` : ''}
            <div class="card-grid-footer">
              ${c.status ? `<span class="status-badge-sm ${cardStatusClasses[c.statusVariant || 'active'] || 'cg-status-active'}">${esc(c.status)}</span>` : '<span></span>'}
              ${c.action ? `<button class="btn btn-ghost btn-sm">${esc(c.action)}</button>` : ''}
            </div>
          </div>
        </div>`).join('')}
    </div>`;
};

const avatarSizeMap: Record<string, { cls: string; px: number }> = {
  sm: { cls: 'ag-sm', px: 28 },
  md: { cls: 'ag-md', px: 36 },
  lg: { cls: 'ag-lg', px: 44 },
};

const AvatarGroup: ComponentFn = (props) => {
  const { avatars = [], max = 5, size = 'md' } = props;
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const sizeDef = avatarSizeMap[size] || avatarSizeMap.md;
  return `
    <div class="avatar-group ${sizeDef.cls}">
      ${visible.map((a: any, i: number) => {
        const name = a.name || '';
        const initials = a.initials || getInitials(name);
        const color = getAvatarColor(name);
        if (a.imageUrl) {
          return `<div class="ag-avatar" style="z-index:${visible.length - i}" title="${esc(name)}"><img src="${esc(a.imageUrl)}" alt="${esc(name)}" class="ag-img" /></div>`;
        }
        return `<div class="ag-avatar" style="z-index:${visible.length - i};background:${color}" title="${esc(name)}"><span class="ag-initials">${esc(initials)}</span></div>`;
      }).join('')}
      ${overflow > 0 ? `<div class="ag-avatar ag-overflow" style="z-index:0"><span class="ag-initials">+${overflow}</span></div>` : ''}
    </div>`;
};

const StarRating: ComponentFn = (props) => {
  const { rating = 0, count, maxStars = 5, distribution, showDistribution } = props;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);
  const stars = '★'.repeat(fullStars) + (hasHalf ? '⯨' : '') + '☆'.repeat(Math.max(0, emptyStars));
  const maxCount = distribution ? Math.max(...distribution.map((d: any) => d.count), 1) : 1;
  return `
    <div class="star-rating-wrap">
      <div class="star-rating-summary">
        <span class="star-rating-value">${rating.toFixed(1)}</span>
        <span class="star-rating-stars">${stars}</span>
        ${count !== undefined ? `<span class="star-rating-count">(${Number(count).toLocaleString()} reviews)</span>` : ''}
      </div>
      ${showDistribution && distribution ? `
        <div class="star-rating-distribution">
          ${distribution.sort((a: any, b: any) => b.stars - a.stars).map((d: any) => {
            const pct = (d.count / maxCount) * 100;
            return `
              <div class="star-dist-row">
                <span class="star-dist-label">${d.stars}★</span>
                <div class="star-dist-track"><div class="star-dist-bar" style="width:${pct}%"></div></div>
                <span class="star-dist-count">${d.count}</span>
              </div>`;
          }).join('')}
        </div>` : ''}
    </div>`;
};

const StockIndicator: ComponentFn = (props) => {
  const { quantity, lowThreshold = 10, criticalThreshold = 3, label } = props;
  let level: string, levelCls: string, icon: string;
  if (quantity <= criticalThreshold) {
    level = 'Critical'; levelCls = 'stock-critical'; icon = '🔴';
  } else if (quantity <= lowThreshold) {
    level = 'Low'; levelCls = 'stock-low'; icon = '🟡';
  } else {
    level = 'In Stock'; levelCls = 'stock-ok'; icon = '🟢';
  }
  return `
    <div class="stock-indicator ${levelCls}">
      <div class="stock-icon">${icon}</div>
      <div class="stock-info">
        ${label ? `<div class="stock-label">${esc(label)}</div>` : ''}
        <div class="stock-qty">${quantity} units</div>
        <div class="stock-level">${level}</div>
      </div>
    </div>`;
};

// ─── Communication & Detail View Components ─────────────────

const chatTypeIcons: Record<string, string> = {
  sms: '💬', email: '📧', call: '📞', whatsapp: '📱',
};

const ChatThread: ComponentFn = (props) => {
  const { messages = [], title } = props;
  if (messages.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">💬</div><p>No messages</p></div>`;
  }
  return `
    <div class="chat-thread">
      ${title ? `<div class="chat-thread-header"><h3 class="chat-thread-title">${esc(title)}</h3><span class="chat-thread-count">${messages.length} messages</span></div>` : ''}
      <div class="chat-thread-body">
        ${messages.map((msg: any) => {
          const isOutbound = msg.direction === 'outbound';
          const typeIcon = chatTypeIcons[msg.type || 'sms'] || '💬';
          const avatarBg = isOutbound ? '#4f46e5' : getAvatarColor(msg.senderName || 'U');
          const initials = getInitials(msg.senderName || (isOutbound ? 'You' : 'Contact'));
          return `
            <div class="chat-msg ${isOutbound ? 'chat-msg-outbound' : 'chat-msg-inbound'}">
              ${!isOutbound ? `<div class="chat-avatar" style="background:${avatarBg}">${msg.avatar ? `<img src="${esc(msg.avatar)}" alt="" class="chat-avatar-img"/>` : initials}</div>` : ''}
              <div class="chat-bubble-wrap ${isOutbound ? 'chat-bubble-wrap-right' : ''}">
                ${msg.senderName ? `<div class="chat-sender">${esc(msg.senderName)}</div>` : ''}
                <div class="chat-bubble ${isOutbound ? 'chat-bubble-outbound' : 'chat-bubble-inbound'}">${esc(msg.content)}</div>
                <div class="chat-meta">${typeIcon} ${esc(msg.timestamp || '')}</div>
              </div>
              ${isOutbound ? `<div class="chat-avatar chat-avatar-outbound" style="background:${avatarBg}">${msg.avatar ? `<img src="${esc(msg.avatar)}" alt="" class="chat-avatar-img"/>` : initials}</div>` : ''}
            </div>`;
        }).join('')}
      </div>
    </div>`;
};

const EmailPreview: ComponentFn = (props) => {
  const { from, to, subject, date, body = '', cc, attachments = [] } = props;
  const sanitizedBody = String(body)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
  return `
    <div class="email-preview">
      <div class="email-header">
        <div class="email-subject">${esc(subject)}</div>
        <div class="email-header-row"><span class="email-label">From</span><span class="email-value">${esc(from)}</span></div>
        <div class="email-header-row"><span class="email-label">To</span><span class="email-value">${esc(to)}</span></div>
        ${cc ? `<div class="email-header-row"><span class="email-label">Cc</span><span class="email-value">${esc(cc)}</span></div>` : ''}
        <div class="email-header-row"><span class="email-label">Date</span><span class="email-value">${esc(date)}</span></div>
      </div>
      ${attachments.length > 0 ? `
        <div class="email-attachments">
          ${attachments.map((a: any) => `<div class="email-attachment">📎 ${esc(a.name)}${a.size ? ` <span class="text-muted">(${esc(a.size)})</span>` : ''}</div>`).join('')}
        </div>` : ''}
      <div class="email-body">${sanitizedBody}</div>
    </div>`;
};

const ContentPreview: ComponentFn = (props) => {
  const { content = '', format = 'html', maxHeight, title } = props;
  let rendered: string;
  if (format === 'html') {
    rendered = String(content)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '');
  } else if (format === 'markdown') {
    rendered = esc(content)
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br/>');
  } else {
    rendered = `<pre class="content-preview-pre">${esc(content)}</pre>`;
  }
  const heightStyle = maxHeight ? `max-height:${maxHeight}px;overflow-y:auto;` : '';
  return `
    <div class="content-preview">
      ${title ? `<div class="content-preview-header"><h3 class="content-preview-title">${esc(title)}</h3></div>` : ''}
      <div class="content-preview-body" style="${heightStyle}">${rendered}</div>
    </div>`;
};

const speakerRoleColors: Record<string, string> = {
  agent: '#4f46e5', customer: '#059669', system: '#6b7280',
};
const speakerRoleLabels: Record<string, string> = {
  agent: 'Agent', customer: 'Customer', system: 'System',
};

const TranscriptView: ComponentFn = (props) => {
  const { entries = [], title, duration } = props;
  if (entries.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">📝</div><p>No transcript available</p></div>`;
  }
  return `
    <div class="transcript-view">
      <div class="transcript-header">
        <div>${title ? `<h3 class="transcript-title">${esc(title)}</h3>` : ''}</div>
        <div class="transcript-meta">
          ${duration ? `<span class="transcript-duration">⏱ ${esc(duration)}</span>` : ''}
          <span class="transcript-count">${entries.length} entries</span>
        </div>
      </div>
      <div class="transcript-body">
        ${entries.map((e: any) => {
          const roleColor = speakerRoleColors[e.speakerRole || 'customer'] || '#6b7280';
          const roleLabel = speakerRoleLabels[e.speakerRole || ''] || '';
          return `
            <div class="transcript-entry">
              <div class="transcript-timestamp">${esc(e.timestamp)}</div>
              <div class="transcript-content">
                <div class="transcript-speaker">
                  <span class="transcript-speaker-dot" style="background:${roleColor}"></span>
                  <span class="transcript-speaker-name">${esc(e.speaker)}</span>
                  ${roleLabel ? `<span class="transcript-role-badge" style="color:${roleColor};background:${roleColor}15">${roleLabel}</span>` : ''}
                </div>
                <div class="transcript-text">${esc(e.text)}</div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>`;
};

const AudioPlayer: ComponentFn = (props) => {
  const { title, duration, type = 'recording' } = props;
  const typeIcon = type === 'voicemail' ? '📩' : '🎙';
  const typeLabel = type === 'voicemail' ? 'Voicemail' : 'Recording';
  const bars = Array.from({ length: 32 }, (_, i) => {
    // Deterministic pseudo-wave based on index
    const base = Math.sin(i * 0.4) * 30 + 50;
    const jitter = ((i * 7 + 13) % 19) * 2;
    return Math.min(95, Math.max(15, Math.round(base + jitter)));
  });
  return `
    <div class="audio-player">
      <div class="audio-player-info">
        <span class="audio-player-icon">${typeIcon}</span>
        <div>
          <div class="audio-player-title">${esc(title || typeLabel)}</div>
          <div class="audio-player-type">${typeLabel}</div>
        </div>
      </div>
      <div class="audio-player-controls">
        <button class="audio-play-btn" aria-label="Play">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div class="audio-waveform">
          ${bars.map((h, i) => `<div class="audio-bar ${i < 10 ? 'audio-bar-played' : ''}" style="height:${h}%"></div>`).join('')}
        </div>
        <span class="audio-duration">${esc(duration || '0:00')}</span>
      </div>
    </div>`;
};

const priorityColors: Record<string, string> = {
  low: '#6b7280', medium: '#d97706', high: '#dc2626',
};
const priorityLabels: Record<string, string> = {
  low: 'Low', medium: 'Med', high: 'High',
};

const ChecklistView: ComponentFn = (props) => {
  const { items = [], title, showProgress } = props;
  const completedCount = items.filter((i: any) => i.completed).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  return `
    <div class="checklist-view">
      ${title || showProgress ? `
        <div class="checklist-header">
          ${title ? `<h3 class="checklist-title">${esc(title)}</h3>` : ''}
          ${showProgress ? `
            <div class="checklist-progress-wrap">
              <span class="checklist-progress-text">${completedCount}/${totalCount} done</span>
              <div class="checklist-progress-track"><div class="checklist-progress-bar" style="width:${pct}%"></div></div>
            </div>` : ''}
        </div>` : ''}
      <div class="checklist-body">
        ${items.length === 0 ? '<div class="empty-state"><p>No tasks</p></div>' :
          items.map((item: any) => {
            const prColor = priorityColors[item.priority || 'low'] || '#6b7280';
            const prLabel = priorityLabels[item.priority || ''] || '';
            return `
              <div class="checklist-item ${item.completed ? 'checklist-item-done' : ''}">
                <div class="checklist-checkbox ${item.completed ? 'checklist-checkbox-checked' : ''}">
                  ${item.completed ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7"/></svg>' : ''}
                </div>
                <div class="checklist-item-content">
                  <div class="checklist-item-title ${item.completed ? 'checklist-item-title-done' : ''}">${esc(item.title)}</div>
                  <div class="checklist-item-meta">
                    ${item.dueDate ? `<span class="checklist-due">📅 ${esc(item.dueDate)}</span>` : ''}
                    ${item.assignee ? `<span class="checklist-assignee">👤 ${esc(item.assignee)}</span>` : ''}
                    ${prLabel ? `<span class="checklist-priority" style="color:${prColor};border-color:${prColor}">${prLabel}</span>` : ''}
                  </div>
                </div>
              </div>`;
          }).join('')}
      </div>
    </div>`;
};

// ─── Visualization & Utility Components ─────────────────────

const CalendarView: ComponentFn = (props) => {
  const { title, events = [], highlightToday = true } = props;
  const now = new Date();
  const year = props.year ?? now.getFullYear();
  const month = props.month ?? (now.getMonth() + 1);
  const monthIdx = month - 1;
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const todayDate = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && monthIdx === now.getMonth();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const eventsByDay: Record<number, any[]> = {};
  for (const evt of events) {
    try {
      const d = new Date(evt.date);
      if (d.getFullYear() === year && d.getMonth() === monthIdx) {
        const day = d.getDate();
        (eventsByDay[day] = eventsByDay[day] || []).push(evt);
      }
    } catch { /* skip */ }
  }

  const defaultColors: Record<string, string> = {
    meeting: '#4f46e5', call: '#059669', task: '#d97706', deadline: '#dc2626', event: '#7c3aed',
  };

  let cells = '';
  for (let i = 0; i < firstDay; i++) {
    cells += '<div class="cal-cell cal-cell-empty"></div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = highlightToday && isCurrentMonth && d === todayDate;
    const dayEvents = eventsByDay[d] || [];
    const evtHtml = dayEvents.slice(0, 3).map((e: any) => {
      const color = e.color || defaultColors[e.type || 'event'] || '#4f46e5';
      return `<div class="cal-evt" style="background:${esc(color)}" title="${esc(e.title)}${e.time ? ' @ ' + esc(e.time) : ''}">${esc(e.title)}</div>`;
    }).join('');
    const more = dayEvents.length > 3 ? `<div class="cal-evt-more">+${dayEvents.length - 3} more</div>` : '';
    cells += `<div class="cal-cell${isToday ? ' cal-today' : ''}"><span class="cal-day-num${isToday ? ' cal-day-today' : ''}">${d}</span><div class="cal-evts">${evtHtml}${more}</div></div>`;
  }

  return `
    <div class="cal-view">
      ${title ? `<div class="cal-title">${esc(title)}</div>` : ''}
      <div class="cal-header-month">${esc(monthNames[monthIdx])} ${year}</div>
      <div class="cal-grid">
        ${dayNames.map(dn => `<div class="cal-day-header">${dn}</div>`).join('')}
        ${cells}
      </div>
    </div>`;
};

const FlowDiagram: ComponentFn = (props) => {
  const { nodes = [], edges = [], direction = 'horizontal', title } = props;
  if (nodes.length === 0) return '<div class="empty-state"><div class="empty-icon">🔗</div><p>No flow nodes</p></div>';

  const nodeMap: Record<string, any> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  const visited = new Set<string>();
  const ordered: string[] = [];
  const starts = nodes.filter((n: any) => n.type === 'start');
  if (starts.length === 0 && nodes.length > 0) starts.push(nodes[0]);

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    ordered.push(id);
    for (const e of edges) {
      if (e.from === id) walk(e.to);
    }
  }
  starts.forEach((s: any) => walk(s.id));
  for (const n of nodes) { if (!visited.has(n.id)) ordered.push(n.id); }

  const typeStyles: Record<string, string> = {
    start: 'flow-node-start', action: 'flow-node-action',
    condition: 'flow-node-condition', end: 'flow-node-end',
  };

  const edgeLabelMap: Record<string, string> = {};
  for (const e of edges) { if (e.label) edgeLabelMap[`${e.from}-${e.to}`] = e.label; }

  const isVert = direction === 'vertical';
  let html = '';

  for (let i = 0; i < ordered.length; i++) {
    const n = nodeMap[ordered[i]];
    if (!n) continue;
    const typeCls = typeStyles[n.type || 'action'] || 'flow-node-action';
    const isCondition = n.type === 'condition';

    html += `<div class="flow-node ${typeCls}${isCondition ? ' flow-diamond' : ''}">
      <div class="flow-node-label">${esc(n.label)}</div>
      ${n.description ? `<div class="flow-node-desc">${esc(n.description)}</div>` : ''}
    </div>`;

    if (i < ordered.length - 1) {
      const edgeKey = `${ordered[i]}-${ordered[i + 1]}`;
      const lbl = edgeLabelMap[edgeKey];
      html += `<div class="flow-arrow ${isVert ? 'flow-arrow-vert' : ''}">
        ${isVert ? '↓' : '→'}
        ${lbl ? `<span class="flow-edge-label">${esc(lbl)}</span>` : ''}
      </div>`;
    }
  }

  return `
    <div class="flow-diagram">
      ${title ? `<div class="flow-title">${esc(title)}</div>` : ''}
      <div class="flow-container ${isVert ? 'flow-vertical' : 'flow-horizontal'}">${html}</div>
    </div>`;
};

const TreeView: ComponentFn = (props) => {
  const { nodes = [], title, expandAll = false } = props;

  function renderNode(node: any, depth: number): string {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandAll || node.expanded !== false;
    const chevron = hasChildren ? (isExpanded ? '▾' : '▸') : '';
    const indent = depth * 20;
    const badge = node.badge ? `<span class="tree-badge">${esc(node.badge)}</span>` : '';
    const icon = node.icon ? `<span class="tree-icon">${esc(node.icon)}</span>` : '';

    let childrenHtml = '';
    if (hasChildren && isExpanded) {
      childrenHtml = node.children.map((c: any) => renderNode(c, depth + 1)).join('');
    }

    return `
      <div class="tree-item" style="padding-left:${indent}px">
        <span class="tree-chevron">${chevron}</span>
        ${icon}
        <span class="tree-label">${esc(node.label)}</span>
        ${badge}
      </div>
      ${childrenHtml}`;
  }

  return `
    <div class="tree-view">
      ${title ? `<div class="tree-title">${esc(title)}</div>` : ''}
      <div class="tree-list">${nodes.map((n: any) => renderNode(n, 0)).join('')}</div>
    </div>`;
};

const MediaGallery: ComponentFn = (props) => {
  const { items = [], columns = 3, title } = props;
  if (items.length === 0) return '<div class="empty-state"><div class="empty-icon">🖼️</div><p>No media items</p></div>';

  const cards = items.map((item: any) => {
    const thumb = item.thumbnailUrl || item.url || '';
    const fname = item.title || 'Untitled';
    const ext = (item.fileType || '').toUpperCase();
    const extBadge = ext ? `<span class="mg-type-badge">${esc(ext)}</span>` : '';

    return `
      <div class="mg-card">
        <div class="mg-thumb">
          ${thumb ? `<img src="${esc(thumb)}" alt="${esc(fname)}" class="mg-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>` : ''}
          <div class="mg-placeholder" ${thumb ? 'style="display:none"' : ''}>
            <span class="mg-placeholder-icon">📄</span>
            ${extBadge}
          </div>
        </div>
        <div class="mg-info">
          <div class="mg-name" title="${esc(fname)}">${esc(fname)}</div>
          <div class="mg-meta">
            ${item.fileSize ? `<span>${esc(item.fileSize)}</span>` : ''}
            ${item.date ? `<span>${esc(item.date)}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="mg-gallery">
      ${title ? `<div class="mg-title">${esc(title)}</div>` : ''}
      <div class="mg-grid" style="grid-template-columns:repeat(${columns},1fr)">${cards}</div>
    </div>`;
};

const DuplicateCompare: ComponentFn = (props) => {
  const { records = [], highlightDiffs = true, title } = props;
  if (records.length < 2) return '<div class="empty-state"><div class="empty-icon">🔍</div><p>Need at least 2 records to compare</p></div>';

  const rec1 = records[0];
  const rec2 = records[1];
  const allFields = new Set<string>();
  for (const k of Object.keys(rec1.fields || {})) allFields.add(k);
  for (const k of Object.keys(rec2.fields || {})) allFields.add(k);
  const fields = Array.from(allFields);

  const rows = fields.map(f => {
    const v1 = (rec1.fields || {})[f] ?? '';
    const v2 = (rec2.fields || {})[f] ?? '';
    const isDiff = highlightDiffs && v1 !== v2;
    return `
      <div class="dc-row">
        <div class="dc-field">${esc(f)}</div>
        <div class="dc-val ${isDiff ? 'dc-diff' : ''}">${esc(v1)}</div>
        <div class="dc-val ${isDiff ? 'dc-diff' : ''}">${esc(v2)}</div>
      </div>`;
  }).join('');

  return `
    <div class="dc-compare">
      ${title ? `<div class="dc-title">${esc(title)}</div>` : ''}
      <div class="dc-header-row">
        <div class="dc-field dc-header-label">Field</div>
        <div class="dc-val dc-header-label">${esc(rec1.label || 'Record A')}</div>
        <div class="dc-val dc-header-label">${esc(rec2.label || 'Record B')}</div>
      </div>
      <div class="dc-body">${rows}</div>
    </div>`;
};


// ─── Interactive Editor Components ──────────────────────────
// These components render interactive forms that call MCP server tools
// via window.callServerTool (set up in main.ts)

const ContactPicker: ComponentFn = (props) => {
  const { searchTool = 'search_contacts', placeholder = 'Search contacts...', value } = props;
  const selectedHtml = value
    ? `<div class="cp-selected"><span class="cp-selected-name">${esc(value.name || value)}</span><button class="cp-clear" data-action="clear-contact">&times;</button></div>`
    : '';
  return `
    <div class="interactive-wrap contact-picker" data-tool="${esc(searchTool)}">
      ${selectedHtml}
      <div class="cp-search-wrap">
        <input type="text" class="search-input cp-input" placeholder="${esc(placeholder)}" data-action="search-contact" />
        <div class="cp-results" style="display:none"></div>
      </div>
    </div>`;
};

const InvoiceBuilder: ComponentFn = (props) => {
  const { createTool = 'create_invoice', contactSearchTool = 'search_contacts', initialContact, initialItems = [] } = props;
  const itemRows = (initialItems.length > 0 ? initialItems : [{ description: '', quantity: 1, unitPrice: 0 }]).map((item: any, i: number) => `
    <tr class="ib-item-row" data-idx="${i}">
      <td><input type="text" class="mcp-field-input ib-desc" value="${esc(item.description || '')}" placeholder="Item description" /></td>
      <td><input type="number" class="mcp-field-input ib-qty" value="${item.quantity || 1}" min="1" style="width:60px" /></td>
      <td><input type="number" class="mcp-field-input ib-price" value="${item.unitPrice || 0}" min="0" step="0.01" style="width:90px" /></td>
      <td class="ib-line-total">$${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</td>
      <td><button class="btn btn-ghost btn-sm ib-remove-row">&times;</button></td>
    </tr>`).join('');

  const total = initialItems.reduce((s: number, i: any) => s + (i.quantity || 1) * (i.unitPrice || 0), 0);

  return `
    <div class="interactive-wrap invoice-builder" data-create-tool="${esc(createTool)}" data-search-tool="${esc(contactSearchTool)}">
      <div class="card">
        <div class="card-header"><h2 class="card-title">New Invoice</h2></div>
        <div class="card-body p-md">
          <div class="mcp-field">
            <label class="mcp-field-label">Contact</label>
            <input type="text" class="mcp-field-input ib-contact" value="${esc(initialContact?.name || '')}" placeholder="Search for contact..." />
          </div>
          <table class="line-items-table" style="margin-top:12px">
            <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead>
            <tbody class="ib-items">${itemRows}</tbody>
          </table>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
            <button class="btn btn-ghost btn-sm ib-add-row">+ Add Item</button>
            <div class="font-mono font-medium ib-grand-total">Total: $${total.toFixed(2)}</div>
          </div>
        </div>
        <div class="mcp-modal-footer" style="border-top:1px solid #e5e7eb;padding:10px 14px">
          <button class="btn btn-primary btn-sm ib-create">Create Invoice</button>
        </div>
      </div>
    </div>`;
};

const OpportunityEditor: ComponentFn = (props) => {
  const { saveTool = 'update_opportunity', opportunity = {}, stages = [] } = props;
  const opp = opportunity;
  const stageOptions = stages.map((s: any) =>
    `<option value="${esc(s.id)}" ${s.id === opp.pipelineStageId ? 'selected' : ''}>${esc(s.name)}</option>`
  ).join('');
  const statusOptions = ['open', 'won', 'lost', 'abandoned'].map(s =>
    `<option value="${s}" ${s === opp.status ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`
  ).join('');

  return `
    <div class="interactive-wrap opportunity-editor" data-tool="${esc(saveTool)}" data-opp-id="${esc(opp.id || '')}">
      <div class="card">
        <div class="card-header"><h2 class="card-title">Edit Opportunity</h2></div>
        <div class="card-body p-md">
          <div class="mcp-field">
            <label class="mcp-field-label">Name</label>
            <input type="text" class="mcp-field-input oe-name" value="${esc(opp.name || '')}" />
          </div>
          <div class="mcp-field">
            <label class="mcp-field-label">Value ($)</label>
            <input type="number" class="mcp-field-input oe-value" value="${opp.monetaryValue || 0}" min="0" step="0.01" />
          </div>
          ${stages.length > 0 ? `
            <div class="mcp-field">
              <label class="mcp-field-label">Stage</label>
              <select class="mcp-field-input oe-stage">${stageOptions}</select>
            </div>` : ''}
          <div class="mcp-field">
            <label class="mcp-field-label">Status</label>
            <select class="mcp-field-input oe-status">${statusOptions}</select>
          </div>
        </div>
        <div class="mcp-modal-footer" style="border-top:1px solid #e5e7eb;padding:10px 14px">
          <button class="btn btn-primary btn-sm oe-save">Save Changes</button>
        </div>
      </div>
    </div>`;
};

const AppointmentBooker: ComponentFn = (props) => {
  const { calendarTool, bookTool, contactSearchTool, calendarId } = props;
  const now = new Date();
  return `
    <div class="interactive-wrap appointment-booker"
         data-calendar-tool="${esc(calendarTool || '')}"
         data-book-tool="${esc(bookTool || 'create_appointment')}"
         data-search-tool="${esc(contactSearchTool || 'search_contacts')}"
         data-calendar-id="${esc(calendarId || '')}">
      <div class="card">
        <div class="card-header"><h2 class="card-title">Book Appointment</h2></div>
        <div class="card-body p-md">
          <div class="mcp-field">
            <label class="mcp-field-label">Contact</label>
            <input type="text" class="mcp-field-input ab-contact" placeholder="Search for contact..." />
          </div>
          <div class="mcp-field">
            <label class="mcp-field-label">Date</label>
            <input type="date" class="mcp-field-input ab-date" value="${now.toISOString().split('T')[0]}" />
          </div>
          <div class="mcp-field">
            <label class="mcp-field-label">Time</label>
            <input type="time" class="mcp-field-input ab-time" value="09:00" />
          </div>
          <div class="mcp-field">
            <label class="mcp-field-label">Notes</label>
            <input type="text" class="mcp-field-input ab-notes" placeholder="Optional notes..." />
          </div>
        </div>
        <div class="mcp-modal-footer" style="border-top:1px solid #e5e7eb;padding:10px 14px">
          <button class="btn btn-primary btn-sm ab-book">Book</button>
        </div>
      </div>
    </div>`;
};

const EditableField: ComponentFn = (props) => {
  const { value, fieldName, saveTool, saveArgs } = props;
  return `
    <span class="editable-field" data-field="${esc(fieldName)}" data-tool="${esc(saveTool || '')}" data-args='${JSON.stringify(saveArgs || {})}' title="Click to edit">
      <span class="ef-display">${esc(value)}</span>
      <input type="text" class="ef-input mcp-field-input" value="${esc(value)}" style="display:none" />
      <span class="ef-edit-icon">✏️</span>
    </span>`;
};

const SelectDropdown: ComponentFn = (props) => {
  const { options = [], value, placeholder = 'Select...' } = props;
  const optionHtml = options.map((o: any) =>
    `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`
  ).join('');
  return `
    <select class="mcp-field-input select-dropdown">
      <option value="">${esc(placeholder)}</option>
      ${optionHtml}
    </select>`;
};

const FormGroup: ComponentFn = (props) => {
  const { fields = [], submitLabel = 'Submit', submitTool } = props;
  const fieldHtml = fields.map((f: any) => {
    const inputType = f.type || 'text';
    let inputHtml: string;
    if (f.options) {
      inputHtml = `<select class="mcp-field-input fg-field" data-key="${esc(f.key)}">
        <option value="">Select...</option>
        ${f.options.map((o: any) => `<option value="${esc(typeof o === 'string' ? o : o.value)}" ${(typeof o === 'string' ? o : o.value) === f.value ? 'selected' : ''}>${esc(typeof o === 'string' ? o : o.label)}</option>`).join('')}
      </select>`;
    } else {
      inputHtml = `<input type="${inputType}" class="mcp-field-input fg-field" data-key="${esc(f.key)}" value="${esc(f.value || '')}" ${f.required ? 'required' : ''} />`;
    }
    return `
      <div class="mcp-field">
        <label class="mcp-field-label">${esc(f.label)}${f.required ? ' *' : ''}</label>
        ${inputHtml}
      </div>`;
  }).join('');

  return `
    <div class="interactive-wrap form-group" data-tool="${esc(submitTool || '')}">
      ${fieldHtml}
      <div style="margin-top:12px;text-align:right">
        <button class="btn btn-primary btn-sm fg-submit">${esc(submitLabel)}</button>
      </div>
    </div>`;
};

const AmountInput: ComponentFn = (props) => {
  const { value = 0, currency = 'USD' } = props;
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  } catch {
    formatted = `$${Number(value).toFixed(2)}`;
  }
  return `
    <div class="interactive-wrap amount-input" data-currency="${esc(currency)}">
      <span class="ai-display currency-display currency-md">${esc(formatted)}</span>
      <input type="number" class="mcp-field-input ai-raw" value="${value}" step="0.01" style="display:none" />
    </div>`;
};

// ─── Component Registry ─────────────────────────────────────

export const COMPONENTS: Record<string, ComponentFn> = {
  PageHeader, Card, StatsGrid, SplitLayout, Section,
  DataTable, KanbanBoard, MetricCard, StatusBadge, Timeline, ProgressBar,
  DetailHeader, KeyValueList, LineItemsTable, InfoBlock,
  SearchBar, FilterChips, TabGroup,
  ActionButton, ActionBar,
  CurrencyDisplay, TagList, CardGrid, AvatarGroup, StarRating, StockIndicator,
  ChatThread, EmailPreview, ContentPreview, TranscriptView, AudioPlayer, ChecklistView,
  CalendarView, FlowDiagram, TreeView, MediaGallery, DuplicateCompare,
  BarChart, LineChart, PieChart, FunnelChart, SparklineChart,
  // Interactive editors
  ContactPicker, InvoiceBuilder, OpportunityEditor, AppointmentBooker,
  EditableField, SelectDropdown, FormGroup, AmountInput,
};
