/**
 * Subscription Manager — Active subscriptions view with MRR stats.
 */
import React, { useState, useMemo, useCallback } from 'react';
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

const STATUS_FILTERS = ['all', 'active', 'paused', 'cancelled', 'trialing'] as const;

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Subscription Manager', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const handleSubAction = useCallback(async (action: string, subData: Record<string, any>) => {
    if (!app) return;
    setIsActing(true);
    setActionResult(null);
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({ action, data: subData }),
        }],
      });
      setActionResult({ type: 'success', msg: `✓ ${action.replace('_', ' ')} request sent` });
      setTimeout(() => setActionResult(null), 3000);
    } catch {
      setActionResult({ type: 'error', msg: '✗ Failed to send request' });
    } finally {
      setIsActing(false);
    }
  }, [app]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const subscriptions: any[] = data.subscriptions || [];
  const currency = data.currency || 'USD';

  const stats = useMemo(() => {
    let mrr = 0, activeCount = 0, cancelledCount = 0;
    for (const sub of subscriptions) {
      const s = (sub.status || '').toLowerCase();
      if (s === 'active' || s === 'trialing') { activeCount++; mrr += sub.amount ?? 0; }
      else if (s === 'cancelled' || s === 'canceled') cancelledCount++;
    }
    const churnRate = subscriptions.length > 0 ? ((cancelledCount / subscriptions.length) * 100).toFixed(1) + '%' : '0%';
    return { mrr, activeCount, churnRate };
  }, [subscriptions]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return subscriptions;
    return subscriptions.filter((sub: any) => (sub.status || '').toLowerCase() === activeFilter);
  }, [subscriptions, activeFilter]);

  const rows = filtered.map((sub: any) => ({
    id: sub.id || '',
    contact: sub.contact || sub.contactName || '—',
    plan: sub.plan || sub.planName || '—',
    amount: formatCurrency(sub.amount ?? 0, sub.currency || currency),
    status: sub.status || '—',
    startDate: formatDate(sub.startDate),
    nextBilling: formatDate(sub.nextBilling || sub.nextBillingDate),
  }));

  const columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true, width: '120px' },
    { key: 'contact', label: 'Contact', sortable: true, format: 'avatar' },
    { key: 'plan', label: 'Plan', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, format: 'currency' },
    { key: 'status', label: 'Status', sortable: true, format: 'status' },
    { key: 'startDate', label: 'Start Date', sortable: true, format: 'date' },
    { key: 'nextBilling', label: 'Next Billing', sortable: true, format: 'date' },
  ];

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle={`${subscriptions.length} subscription${subscriptions.length !== 1 ? 's' : ''}`} />

      <StatsGrid columns={3}>
        <MetricCard label="Monthly Recurring Revenue" value={formatCurrency(stats.mrr, currency)} color="green" />
        <MetricCard label="Active Subscriptions" value={String(stats.activeCount)} color="blue" />
        <MetricCard label="Churn Rate" value={stats.churnRate} color="red" />
      </StatsGrid>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0' }}>
        <div className="filter-chips">
          {STATUS_FILTERS.map((f) => (
            <button key={f} className={`chip ${activeFilter === f ? 'chip-active' : ''}`} onClick={() => setActiveFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {actionResult && (
          <span style={{ color: actionResult.type === 'success' ? '#059669' : '#dc2626', fontSize: 13 }}>
            {actionResult.msg}
          </span>
        )}
      </div>

      <DataTable columns={columns} rows={rows} pageSize={10} emptyMessage="No subscriptions found" />

      {/* Quick subscription actions */}
      {filtered.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: '28px' }}>Actions:</span>
          {filtered
            .filter((sub: any) => (sub.status || '').toLowerCase() === 'active')
            .slice(0, 5)
            .map((sub: any) => (
              <span key={sub.id} style={{ display: 'inline-flex', gap: 2 }}>
                <button
                  className="chip"
                  onClick={() => handleSubAction('cancel_subscription', { subscriptionId: sub.id, contactName: sub.contact || sub.contactName })}
                  disabled={isActing}
                  title={`Cancel subscription ${sub.id}`}
                  style={{ color: '#dc2626' }}
                >
                  ✗ Cancel {sub.plan || sub.planName || sub.id}
                </button>
                <button
                  className="chip"
                  onClick={() => handleSubAction('pause_subscription', { subscriptionId: sub.id, contactName: sub.contact || sub.contactName })}
                  disabled={isActing}
                  title={`Pause subscription ${sub.id}`}
                  style={{ color: '#d97706' }}
                >
                  ⏸ Pause
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
