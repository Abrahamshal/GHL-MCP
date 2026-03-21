import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { Card } from '../../components/layout/Card';
import { KeyValueList } from '../../components/data/KeyValueList';
import { StatusBadge } from '../../components/data/StatusBadge';
import { Timeline } from '../../components/data/Timeline';
import type { TimelineEvent, StatusVariant, KeyValueItem } from '../../types';
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getStatusVariant(status: string): StatusVariant {
  switch (status?.toLowerCase()) {
    case 'won': return 'won';
    case 'lost': return 'lost';
    case 'abandoned': return 'abandoned';
    default: return 'open';
  }
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
    appInfo: { name: 'Opportunity Card', version: '1.0.0' },
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
        content: [{ type: 'text', text: `User action: ${action} for opportunity ${opp.id || opp.name}` }],
      });
    } catch {}
  };

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const opp = data.opportunity || {};
  const contact = opp.contact || {};
  const contactName = contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '—';
  const status = opp.status || 'open';

  const dealInfo: KeyValueItem[] = [
    { label: 'Value', value: formatCurrency(opp.monetaryValue || opp.value || 0), bold: true },
    { label: 'Stage', value: opp.stageName || opp.stage || '—' },
    { label: 'Status', value: status },
    { label: 'Pipeline', value: opp.pipelineName || opp.pipeline || '—' },
    { label: 'Source', value: opp.source || '—' },
    { label: 'Created', value: formatDate(opp.createdAt || opp.dateAdded) },
    { label: 'Last Updated', value: formatDate(opp.updatedAt || opp.lastStatusChangeAt) },
    { label: 'Assigned To', value: opp.assignedTo || '—' },
  ];

  const contactInfo: KeyValueItem[] = [
    { label: 'Contact', value: contactName },
    { label: 'Email', value: contact.email || opp.contactEmail || '—' },
    { label: 'Phone', value: contact.phone || opp.contactPhone || '—' },
    { label: 'Company', value: contact.companyName || opp.companyName || '—' },
  ];

  const activities: TimelineEvent[] = (opp.activities || opp.notes || []).map((a: any) => ({
    title: a.title || a.type || 'Activity',
    description: a.description || a.body || '',
    timestamp: a.timestamp || a.createdAt || '',
    icon: a.type === 'note' ? 'note' : a.type === 'call' ? 'phone' : a.type === 'email' ? 'email' : 'system',
    variant: 'default' as const,
  }));

  return (
    <div>
      <DetailHeader
        title={opp.name || 'Opportunity'}
        subtitle={formatCurrency(opp.monetaryValue || opp.value || 0)}
        entityId={opp.id}
        status={status}
        statusVariant={getStatusVariant(status)}
      />

      <div className="action-bar align-right" style={{ margin: '12px 0' }}>
        <button className="btn btn-primary btn-sm" onClick={() => handleAction('Edit')}>✏️ Edit</button>
        <button className="btn btn-secondary btn-sm" onClick={() => handleAction('Move Stage')}>📋 Move Stage</button>
        <button className="btn btn-primary btn-sm" onClick={() => handleAction('Mark Won')}>🏆 Mark Won</button>
        <button className="btn btn-danger btn-sm" onClick={() => handleAction('Mark Lost')}>❌ Mark Lost</button>
      </div>

      <SplitLayout ratio="67/33" gap="md">
        <div>
          <Card title="Deal Information">
            <KeyValueList items={dealInfo} />
          </Card>
          {activities.length > 0 && (
            <Card title="Activity" subtitle={`${activities.length} events`}>
              <Timeline events={activities} />
            </Card>
          )}
        </div>
        <div>
          <Card title="Contact">
            <KeyValueList items={contactInfo} />
          </Card>
          <Card title="Status" padding="sm">
            <div style={{ textAlign: 'center', padding: 8 }}>
              <StatusBadge label={status} variant={getStatusVariant(status)} />
            </div>
          </Card>
        </div>
      </SplitLayout>
    </div>
  );
}
