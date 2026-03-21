/**
 * Product Detail — Single product view with prices and inventory.
 */
import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { KeyValueList } from '../../components/data/KeyValueList';
import { DataTable } from '../../components/data/DataTable';
import { CurrencyDisplay } from '../../components/data/CurrencyDisplay';
import { StockIndicator } from '../../components/data/StockIndicator';
import type { StatusVariant, KeyValueItem, TableColumn } from '../../types';
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

function statusVariant(status?: string): StatusVariant {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'published') return 'active';
  if (s === 'draft') return 'draft';
  if (s === 'archived' || s === 'inactive') return 'paused';
  return 'active';
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Product Detail', version: '1.0.0' },
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

  const p = data.product || {};
  const prices: any[] = data.prices || [];
  const currency = p.currency || 'USD';
  const variant = statusVariant(p.status);

  const details: KeyValueItem[] = [];
  if (p.sku) details.push({ label: 'SKU', value: p.sku });
  if (p.category) details.push({ label: 'Category', value: p.category });
  if (p.type) details.push({ label: 'Type', value: p.type });
  if (p.price !== undefined) details.push({ label: 'Base Price', value: formatCurrency(p.price, currency), bold: true });
  if (p.createdAt) details.push({ label: 'Created', value: formatDate(p.createdAt) });
  if (p.updatedAt) details.push({ label: 'Updated', value: formatDate(p.updatedAt) });

  const priceRows = prices.map((pr: any, i: number) => ({
    id: pr.id || String(i),
    name: pr.name || 'Price',
    amount: formatCurrency(pr.amount ?? 0, pr.currency || currency),
    type: pr.recurring ? `Recurring (${pr.interval || 'month'})` : 'One-time',
    trialDays: pr.trialDays ? `${pr.trialDays} days` : '—',
  }));

  const priceColumns: TableColumn[] = [
    { key: 'name', label: 'Price Name', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, format: 'currency' },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'trialDays', label: 'Trial', sortable: false },
  ];

  const stockQty = p.inventory ?? p.stockQuantity;

  return (
    <div>
      <DetailHeader title={p.name || p.title || 'Product'} entityId={p.id} status={p.status || 'Active'} statusVariant={variant} />

      <SplitLayout ratio="67/33" gap="md">
        <div>
          {p.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>Description</div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, wordBreak: 'break-word' }}>{p.description}</div>
            </div>
          )}
          <KeyValueList items={details} />
        </div>
        <div>
          {p.price !== undefined && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Price</div>
              <CurrencyDisplay amount={p.price} currency={currency} size="lg" />
            </div>
          )}
          {stockQty !== undefined && (
            <StockIndicator quantity={stockQty} lowThreshold={p.lowStockThreshold || 10} label="Inventory" />
          )}
        </div>
      </SplitLayout>

      {priceRows.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Pricing Plans</h3>
          <DataTable columns={priceColumns} rows={priceRows} pageSize={10} emptyMessage="No prices configured" />
        </div>
      )}
    </div>
  );
}
