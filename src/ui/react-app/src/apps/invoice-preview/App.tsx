/**
 * Invoice Preview — Formatted invoice view with line items and totals.
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
import { CurrencyDisplay } from '../../components/data/CurrencyDisplay';
import type { StatusVariant, KeyValueItem, LineItem } from '../../types';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Helpers ────────────────────────────────────────────────

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
  if (s === 'paid') return 'paid';
  if (s === 'sent') return 'sent';
  if (s === 'draft') return 'draft';
  if (s === 'overdue') return 'error';
  if (s === 'cancelled' || s === 'void') return 'lost';
  if (s === 'pending') return 'pending';
  return 'active';
}

function formatCurrency(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return d;
  }
}

// ─── Component ──────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Invoice Preview', version: '1.0.0' },
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

  const inv = data.invoice || {};
  const currency = inv.currency || 'USD';

  // Build line items
  const lineItems: LineItem[] = (inv.items || []).map((item: any) => ({
    name: item.name || 'Item',
    description: item.description,
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    total: item.total ?? (item.quantity ?? 1) * (item.unitPrice ?? 0),
  }));

  // From/To info
  const fromLines: string[] = [];
  if (inv.from?.email) fromLines.push(inv.from.email);
  if (inv.from?.phone) fromLines.push(inv.from.phone);
  if (inv.from?.address) fromLines.push(inv.from.address);

  const toLines: string[] = [];
  if (inv.to?.email) toLines.push(inv.to.email);
  if (inv.to?.phone) toLines.push(inv.to.phone);
  if (inv.to?.address) toLines.push(inv.to.address);

  // Totals
  const totals: KeyValueItem[] = [
    { label: 'Subtotal', value: formatCurrency(inv.subtotal ?? 0, currency) },
  ];
  if (inv.discount && inv.discount > 0) {
    totals.push({ label: 'Discount', value: `-${formatCurrency(inv.discount, currency)}`, variant: 'success' });
  }
  if (inv.tax !== undefined) {
    totals.push({ label: inv.taxRate ? `Tax (${inv.taxRate}%)` : 'Tax', value: formatCurrency(inv.tax, currency) });
  }
  totals.push({ label: 'Total', value: formatCurrency(inv.total ?? 0, currency), isTotalRow: true });
  if (inv.amountPaid !== undefined && inv.amountPaid > 0) {
    totals.push({ label: 'Amount Paid', value: formatCurrency(inv.amountPaid, currency), variant: 'success' });
  }
  if (inv.amountDue !== undefined) {
    totals.push({ label: 'Amount Due', value: formatCurrency(inv.amountDue, currency), bold: true });
  }

  const details: KeyValueItem[] = [
    { label: 'Invoice Number', value: inv.invoiceNumber || '—' },
    { label: 'Date Issued', value: formatDate(inv.createdAt) },
    { label: 'Due Date', value: formatDate(inv.dueDate) },
  ];
  if (inv.paidDate) details.push({ label: 'Date Paid', value: formatDate(inv.paidDate), variant: 'success' });

  const variant = statusVariant(inv.status);

  return (
    <div>
      <DetailHeader
        title={inv.title || `Invoice ${inv.invoiceNumber || ''}`}
        entityId={inv.id}
        status={inv.status || 'Draft'}
        statusVariant={variant}
      />

      <SplitLayout ratio="50/50" gap="md">
        <div>
          <InfoBlock label="From" name={inv.from?.company || inv.from?.name || 'Your Business'} lines={fromLines} />
        </div>
        <div>
          <InfoBlock label="Bill To" name={inv.to?.company || inv.to?.name || 'Customer'} lines={toLines} />
        </div>
      </SplitLayout>

      <div style={{ margin: '16px 0' }}>
        <KeyValueList items={details} compact />
      </div>

      <LineItemsTable items={lineItems} currency={currency} />

      <div style={{ maxWidth: 360, marginLeft: 'auto', marginTop: 16 }}>
        <KeyValueList items={totals} />
      </div>

      {inv.status && (
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Payment Status:</span>
          <StatusBadge label={inv.status} variant={variant} />
        </div>
      )}

      {inv.notes && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 13, color: '#374151', wordBreak: 'break-word' }}>{inv.notes}</div>
        </div>
      )}
    </div>
  );
}
