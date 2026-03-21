/**
 * Transaction List — Payments table with stats and filtering.
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

const TYPE_FILTERS = ['all', 'payment', 'refund', 'charge', 'subscription'] as const;

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Transaction List', version: '1.0.0' },
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

  const transactions: any[] = data.transactions || [];
  const currency = data.currency || 'USD';

  const stats = useMemo(() => {
    let totalRevenue = 0, refunds = 0, count = 0;
    for (const txn of transactions) {
      const amt = txn.amount ?? 0;
      if ((txn.type || '').toLowerCase() === 'refund') refunds += Math.abs(amt);
      else totalRevenue += amt;
      count++;
    }
    return { totalRevenue, avgTransaction: count > 0 ? totalRevenue / count : 0, refunds };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return transactions;
    return transactions.filter((txn: any) => (txn.type || '').toLowerCase() === activeFilter);
  }, [transactions, activeFilter]);

  const rows = filtered.map((txn: any) => ({
    id: txn.id || '',
    amount: formatCurrency(txn.amount ?? 0, txn.currency || currency),
    type: txn.type || '—',
    status: txn.status || '—',
    contact: txn.contact || txn.contactName || '—',
    date: formatDate(txn.date),
    paymentMethod: txn.paymentMethod || '—',
  }));

  const columns: TableColumn[] = [
    { key: 'id', label: 'Transaction ID', sortable: true, width: '140px' },
    { key: 'amount', label: 'Amount', sortable: true, format: 'currency' },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true, format: 'status' },
    { key: 'contact', label: 'Contact', sortable: true },
    { key: 'date', label: 'Date', sortable: true, format: 'date' },
    { key: 'paymentMethod', label: 'Method', sortable: true },
  ];

  return (
    <div>
      <PageHeader title="Transactions" subtitle={`${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`} />

      <StatsGrid columns={3}>
        <MetricCard label="Total Revenue" value={formatCurrency(stats.totalRevenue, currency)} color="green" />
        <MetricCard label="Avg Transaction" value={formatCurrency(stats.avgTransaction, currency)} color="blue" />
        <MetricCard label="Refunds" value={formatCurrency(stats.refunds, currency)} color="red" />
      </StatsGrid>

      <div className="filter-chips" style={{ margin: '16px 0' }}>
        {TYPE_FILTERS.map((f) => (
          <button key={f} className={`chip ${activeFilter === f ? 'chip-active' : ''}`} onClick={() => setActiveFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <DataTable columns={columns} rows={rows} pageSize={10} emptyMessage="No transactions found" />
    </div>
  );
}
