import React from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { useState } from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { DuplicateCompare } from '../../components/viz/DuplicateCompare';
import type { CompareRecord } from '../../types';
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

function contactToRecord(c: any, label: string): CompareRecord {
  const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
  return {
    label,
    fields: {
      'Name': fullName,
      'Email': c.email || '—',
      'Phone': c.phone || '—',
      'Company': c.companyName || c.company || '—',
      'Address': [c.address1, c.city, c.state, c.postalCode].filter(Boolean).join(', ') || '—',
      'Source': c.source || '—',
      'Tags': (c.tags || []).join(', ') || '—',
      'Date Added': formatDate(c.dateAdded || c.createdAt),
    },
  };
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Duplicate Checker', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const handleAction = async (action: string) => {
    if (!app) return;
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: `User action: ${action} — contact: ${data?.contact?.id || '?'}, duplicate: ${data?.duplicate?.id || '?'}`,
        }],
      });
    } catch {}
  };

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const contact = data.contact || {};
  const duplicate = data.duplicate || {};

  const records: CompareRecord[] = [
    contactToRecord(contact, 'Original'),
    contactToRecord(duplicate, 'Duplicate'),
  ];

  return (
    <PageHeader title="Duplicate Checker" subtitle="Compare and resolve duplicate contacts">
      <DuplicateCompare
        records={records}
        highlightDiffs
        title="Field Comparison"
      />

      <div className="action-bar align-center" style={{ marginTop: 16 }}>
        <button className="btn btn-primary btn-md" onClick={() => handleAction('Merge')}>
          🔗 Merge Records
        </button>
        <button className="btn btn-secondary btn-md" onClick={() => handleAction('Keep Both')}>
          ✌️ Keep Both
        </button>
        <button className="btn btn-danger btn-md" onClick={() => handleAction('Delete Duplicate')}>
          🗑 Delete Duplicate
        </button>
      </div>
    </PageHeader>
  );
}
