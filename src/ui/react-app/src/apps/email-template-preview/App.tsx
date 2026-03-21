/**
 * email-template-preview — Rendered email template preview.
 * Shows email content with metadata and action buttons.
 */
import React, { useState, useEffect } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { DetailHeader } from '../../components/data/DetailHeader';
import { EmailPreview } from '../../components/comms/EmailPreview';
import { KeyValueList } from '../../components/data/KeyValueList';
import { ActionBar } from '../../components/shared/ActionBar';
import { ActionButton } from '../../components/shared/ActionButton';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface EmailTemplate {
  id?: string;
  name?: string;
  subject?: string;
  from?: string;
  to?: string;
  body?: string;
  category?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  cc?: string;
  attachments?: { name: string; size?: string }[];
}

interface TemplateData {
  template: EmailTemplate;
}

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): TemplateData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as TemplateData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as TemplateData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

function formatDate(d?: string): string {
  if (!d) return '\u2014';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<TemplateData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as TemplateData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'email-template-preview', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (createdApp) => {
      createdApp.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  if (error) {
    return <div className="error-state"><h3>Connection Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected || !app) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;
  }

  return (
    <MCPAppProvider app={app}>
      <ChangeTrackerProvider>
        <div id="app">
          <TemplatePreviewView template={data.template} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function TemplatePreviewView({ template }: { template: EmailTemplate }) {
  const t = template;

  const metadataItems = [
    ...(t.category ? [{ label: 'Category', value: t.category }] : []),
    ...(t.createdAt ? [{ label: 'Created', value: formatDate(t.createdAt) }] : []),
    ...(t.updatedAt ? [{ label: 'Updated', value: formatDate(t.updatedAt) }] : []),
    ...(t.id ? [{ label: 'Template ID', value: t.id, variant: 'muted' as const }] : []),
  ];

  return (
    <>
      <DetailHeader
        title={t.name || 'Email Template'}
        subtitle={t.category || 'Uncategorized'}
        entityId={t.id}
        status={t.status || 'draft'}
        statusVariant={t.status === 'active' ? 'active' : 'draft'}
      />

      <EmailPreview
        from={t.from || 'noreply@example.com'}
        to={t.to || '{{contact.email}}'}
        subject={t.subject || '(No subject)'}
        date={t.updatedAt || t.createdAt || '—'}
        body={t.body || '<p>No content</p>'}
        cc={t.cc}
        attachments={t.attachments}
      />

      {metadataItems.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <KeyValueList items={metadataItems} />
        </div>
      )}

      <div style={{ marginTop: 16 }}>
      <ActionBar align="right">
        <ActionButton
          label="Edit"
          variant="primary"
          size="sm"
          toolName="update_email_template"
          toolArgs={{ templateId: t.id }}
        />
        <ActionButton
          label="Duplicate"
          variant="secondary"
          size="sm"
          toolName="duplicate_email_template"
          toolArgs={{ templateId: t.id }}
        />
        <ActionButton
          label="Delete"
          variant="danger"
          size="sm"
          toolName="delete_email_template"
          toolArgs={{ templateId: t.id }}
        />
      </ActionBar>
      </div>
    </>
  );
}
