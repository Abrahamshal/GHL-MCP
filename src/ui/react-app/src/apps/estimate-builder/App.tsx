/**
 * Estimate Builder — Create estimate form with contact, line items, and notes.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
import { ContactPicker } from '../../components/interactive/ContactPicker';
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

interface LineItem { description: string; quantity: number; unitPrice: number; }
interface SelectedContact { id: string; name?: string; firstName?: string; lastName?: string; email?: string; [key: string]: any; }

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Estimate Builder', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const [title, setTitle] = useState('');
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  const currency = data?.currency || 'USD';

  const updateItem = useCallback((index: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next; });
  }, []);

  const addItem = () => setLineItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setLineItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = useMemo(() => lineItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0), [lineItems]);

  const getContactName = (c: SelectedContact): string => {
    if (c.name) return c.name;
    return [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown';
  };

  const handleCreate = async () => {
    if (!app) return;
    setIsCreating(true);
    setCreateSuccess(false);
    const contactName = selectedContact ? getContactName(selectedContact) : undefined;
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({
            action: 'create_estimate',
            title, contactId: selectedContact?.id, contactName,
            items: lineItems.map((it) => ({ description: it.description, quantity: it.quantity, unitPrice: it.unitPrice, total: it.quantity * it.unitPrice })),
            subtotal, total: subtotal, currency, notes, expiryDate: expiryDate || undefined,
          }),
        }],
      });
      setCreateSuccess(true);
    } catch {}
    setIsCreating(false);
  };

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;

  return (
    <div>
      <PageHeader title="Create Estimate" subtitle="Build and send a new estimate" status="Draft" statusVariant="draft" />

      <Card title="Estimate Details" padding="md">
        <div className="mcp-field">
          <label className="mcp-field-label">Title</label>
          <input type="text" className="mcp-field-input" placeholder="Estimate title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mcp-field">
          <label className="mcp-field-label">Contact</label>
          <ContactPicker searchTool={data?.contactSearchTool || 'search_contacts'} placeholder="Search contacts..." onSelect={(c: any) => setSelectedContact(c)} />
        </div>
        <div className="mcp-field">
          <label className="mcp-field-label">Expiry Date</label>
          <input type="date" className="mcp-field-input" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
      </Card>

      <Card title="Line Items" padding="md">
        <table className="ib-table">
          <thead><tr><th className="ib-th-desc">Description</th><th className="ib-th-num">Qty</th><th className="ib-th-num">Price</th><th className="ib-th-num">Total</th><th className="ib-th-act"></th></tr></thead>
          <tbody>
            {lineItems.map((item, idx) => (
              <tr key={idx}>
                <td><input type="text" className="mcp-field-input" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Item description" /></td>
                <td><input type="number" className="mcp-field-input ib-num-input" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} min={0} /></td>
                <td><input type="number" className="mcp-field-input ib-num-input" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} min={0} step="0.01" /></td>
                <td className="ib-total-cell">{formatCurrency(item.quantity * item.unitPrice, currency)}</td>
                <td>{lineItems.length > 1 && <button className="btn btn-ghost btn-sm ib-remove-btn" onClick={() => removeItem(idx)} title="Remove">×</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-ghost btn-sm ib-add-btn" onClick={addItem}>+ Add Line Item</button>
        <div className="ib-totals" style={{ marginTop: 16 }}>
          <div className="ib-total-row ib-total-final"><span>Total</span><span className="ib-total-val">{formatCurrency(subtotal, currency)}</span></div>
        </div>
      </Card>

      <Card title="Notes" padding="md">
        <textarea className="mcp-field-input fg-textarea" placeholder="Additional notes or terms..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </Card>

      <div className="ib-actions" style={{ marginTop: 16 }}>
        {createSuccess && <span style={{ color: '#059669', fontSize: 13 }}>✓ Estimate created</span>}
        <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={isCreating || lineItems.length === 0}>
          {isCreating ? 'Creating...' : 'Create Estimate'}
        </button>
      </div>
    </div>
  );
}
