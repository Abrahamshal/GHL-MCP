/**
 * Invoice List — All invoices table with status filtering and stats.
 */
import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
import type { TableColumn } from '../../types';
import '../../styles/base.css';
import '../../styles/interactive.css';

function extractData(result: CallToolResult): any {
  const sc = (result as any).structuredContent;
  if (sc) return sc;
  for (const item of result.content || []) {
    if (item.type === 'text') {
      try { return JSON.parse(item.text); } catch {}
    }
  }
  return null;
}

function formatCurrency(n: number, currency = 'USD'): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

const STATUS_FILTERS = ['all', 'draft', 'sent', 'paid', 'overdue'] as const;

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Invoice List', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const invoices: any[] = data.invoices || [];
  const currency = data.currency || 'USD';

  // Stats
  const stats = useMemo(() => {
    let totalOutstanding = 0, totalPaid = 0, overdueCount = 0;
    for (const inv of invoices) {
      const s = (inv.status || '').toLowerCase();
      const amt = inv.amount ?? 0;
      if (s === 'paid') totalPaid += amt;
      else if (s === 'overdue') { totalOutstanding += amt; overdueCount++; }
      else if (s !== 'cancelled' && s !== 'void') totalOutstanding += amt;
    }
    return { totalOutstanding, totalPaid, overdueCount };
  }, [invoices]);

  // Filter
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return invoices;
    return invoices.filter((inv: any) => (inv.status || '').toLowerCase() === activeFilter);
  }, [invoices, activeFilter]);

  const rows = filtered.map((inv: any) => ({
    id: inv.id || inv.invoiceNumber || '',
    invoiceNumber: inv.invoiceNumber || '—',
    contact: inv.contact || inv.contactName || '—',
    amount: formatCurrency(inv.amount ?? 0, inv.currency || currency),
    status: inv.status || 'draft',
    dueDate: formatDate(inv.dueDate),
    createdAt: formatDate(inv.createdAt),
  }));

  const columns: TableColumn[] = [
    { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
    { key: 'contact', label: 'Contact', sortable: true, format: 'avatar' },
    { key: 'amount', label: 'Amount', sortable: true, format: 'currency' },
    { key: 'status', label: 'Status', sortable: true, format: 'status' },
    { key: 'dueDate', label: 'Due Date', sortable: true, format: 'date' },
    { key: 'createdAt', label: 'Created', sortable: true, format: 'date' },
  ];

  return (
    <div>
      <PageHeader title="Invoices" subtitle={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`} />

      <StatsGrid columns={3}>
        <MetricCard label="Total Outstanding" value={formatCurrency(stats.totalOutstanding, currency)} color="yellow" />
        <MetricCard label="Total Paid" value={formatCurrency(stats.totalPaid, currency)} color="green" />
        <MetricCard label="Overdue" value={String(stats.overdueCount)} color="red" />
      </StatsGrid>

      <div className="filter-chips" style={{ margin: '16px 0' }}>
        {STATUS_FILTERS.map((f) => (
          <button key={f} className={`chip ${activeFilter === f ? 'chip-active' : ''}`} onClick={() => setActiveFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <DataTable columns={columns} rows={rows} pageSize={10} emptyMessage="No invoices found" />
    </div>
  );
}
