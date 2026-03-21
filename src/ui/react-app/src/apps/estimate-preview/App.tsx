/**
 * Estimate Preview — Formatted estimate view with line items and totals.
 */
import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { InfoBlock } from '../../components/data/InfoBlock';
import { LineItemsTable } from '../../components/data/LineItemsTable';
import { KeyValueList } from '../../components/data/KeyValueList';
import { StatusBadge } from '../../components/data/StatusBadge';
import type { StatusVariant, KeyValueItem, LineItem } from '../../types';
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

function statusVariant(status?: string): StatusVariant {
  const s = (status || '').toLowerCase();
  if (s === 'accepted' || s === 'approved') return 'paid';
  if (s === 'sent') return 'sent';
  if (s === 'draft') return 'draft';
  if (s === 'expired') return 'error';
  if (s === 'declined' || s === 'rejected') return 'lost';
  if (s === 'pending') return 'pending';
  return 'active';
}

function formatCurrency(n: number, currency = 'USD'): string {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n); }
  catch { return `$${n.toFixed(2)}`; }
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
  catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Estimate Preview', version: '1.0.0' },
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

  const est = data.estimate || {};
  const currency = est.currency || 'USD';

  const lineItems: LineItem[] = (est.items || []).map((item: any) => ({
    name: item.name || 'Item',
    description: item.description,
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    total: item.total ?? (item.quantity ?? 1) * (item.unitPrice ?? 0),
  }));

  const fromLines: string[] = [];
  if (est.from?.email) fromLines.push(est.from.email);
  if (est.from?.phone) fromLines.push(est.from.phone);
  if (est.from?.address) fromLines.push(est.from.address);

  const toLines: string[] = [];
  if (est.to?.email) toLines.push(est.to.email);
  if (est.to?.phone) toLines.push(est.to.phone);
  if (est.to?.address) toLines.push(est.to.address);

  const totals: KeyValueItem[] = [
    { label: 'Subtotal', value: formatCurrency(est.subtotal ?? 0, currency) },
  ];
  if (est.discount && est.discount > 0) {
    totals.push({ label: 'Discount', value: `-${formatCurrency(est.discount, currency)}`, variant: 'success' });
  }
  if (est.tax !== undefined) {
    totals.push({ label: est.taxRate ? `Tax (${est.taxRate}%)` : 'Tax', value: formatCurrency(est.tax, currency) });
  }
  totals.push({ label: 'Total', value: formatCurrency(est.total ?? 0, currency), isTotalRow: true });

  const details: KeyValueItem[] = [
    { label: 'Estimate Number', value: est.estimateNumber || '—' },
    { label: 'Date Created', value: formatDate(est.createdAt) },
    { label: 'Valid Until', value: formatDate(est.expiryDate || est.validUntil) },
  ];

  const variant = statusVariant(est.status);

  return (
    <div>
      <DetailHeader
        title={est.title || `Estimate ${est.estimateNumber || ''}`}
        entityId={est.id}
        status={est.status || 'Draft'}
        statusVariant={variant}
      />

      <SplitLayout ratio="50/50" gap="md">
        <div><InfoBlock label="From" name={est.from?.company || est.from?.name || 'Your Business'} lines={fromLines} /></div>
        <div><InfoBlock label="To" name={est.to?.company || est.to?.name || 'Customer'} lines={toLines} /></div>
      </SplitLayout>

      <div style={{ margin: '16px 0' }}><KeyValueList items={details} compact /></div>

      <LineItemsTable items={lineItems} currency={currency} />

      <div style={{ maxWidth: 360, marginLeft: 'auto', marginTop: 16 }}>
        <KeyValueList items={totals} />
      </div>

      {est.status && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Status:</span>
          <StatusBadge label={est.status} variant={variant} />
        </div>
      )}

      {est.notes && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 13, color: '#374151', wordBreak: 'break-word' }}>{est.notes}</div>
        </div>
      )}
    </div>
  );
}
