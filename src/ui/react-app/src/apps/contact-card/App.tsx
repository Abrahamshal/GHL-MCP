import React from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { useState } from 'react';
import { DetailHeader } from '../../components/data/DetailHeader';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { Card } from '../../components/layout/Card';
import { KeyValueList } from '../../components/data/KeyValueList';
import { TagList } from '../../components/data/TagList';
import '../../styles/base.css';
import '../../styles/interactive.css';

function formatDate(d: string | undefined): string {
  if (!d || d === '—') return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return d; }
}

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

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Contact Card', version: '1.0.0' },
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

  const c = data.contact || {};
  const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown';
  const tags: string[] = c.tags || [];

  const contactInfo = [
    { label: 'Email', value: c.email || '—' },
    { label: 'Phone', value: c.phone || '—' },
    { label: 'Company', value: c.companyName || c.company || '—' },
    { label: 'Address', value: [c.address1, c.city, c.state, c.postalCode, c.country].filter(Boolean).join(', ') || '—' },
    { label: 'Source', value: c.source || '—' },
    { label: 'Date Added', value: formatDate(c.dateAdded || c.createdAt) },
    { label: 'Last Activity', value: formatDate(c.lastActivity) },
  ];

  const customFields = Object.entries(c.customFields || c.customField || {}).map(
    ([key, val]) => ({ label: key, value: String(val ?? '—') })
  );

  const handleAction = async (action: string) => {
    if (!app) return;
    try {
      await app.updateModelContext({
        content: [{ type: 'text', text: `User action: ${action} for contact ${c.id || fullName}` }],
      });
    } catch {}
  };

  return (
    <div>
      <DetailHeader
        title={fullName}
        subtitle={c.email || undefined}
        entityId={c.id}
        status={c.type || 'lead'}
        statusVariant={c.type === 'customer' ? 'complete' : 'active'}
      />

      <div className="action-bar align-right" style={{ margin: '12px 0' }}>
        <button className="btn btn-primary btn-sm" onClick={() => handleAction('Edit')}>✏️ Edit</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('Add Note')}>📝 Add Note</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('Add Task')}>✅ Add Task</button>
        <button className="btn btn-danger btn-sm" onClick={() => handleAction('Delete')}>🗑 Delete</button>
      </div>

      <SplitLayout ratio="67/33" gap="md">
        <Card title="Contact Information">
          <KeyValueList items={contactInfo} />
          {tags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span className="kv-label" style={{ display: 'block', marginBottom: 6 }}>Tags</span>
              <TagList tags={tags} />
            </div>
          )}
        </Card>
        <div>
          {customFields.length > 0 && (
            <Card title="Custom Fields">
              <KeyValueList items={customFields} compact />
            </Card>
          )}
          <Card title="Summary">
            <KeyValueList
              items={[
                { label: 'Type', value: c.type || 'lead' },
                { label: 'DND', value: c.dnd ? 'Yes' : 'No', variant: c.dnd ? 'danger' as const : undefined },
                { label: 'Assigned To', value: c.assignedTo || '—' },
              ]}
              compact
            />
          </Card>
        </div>
      </SplitLayout>
    </div>
  );
}
