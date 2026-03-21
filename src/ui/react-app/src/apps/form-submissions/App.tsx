import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { DataTable } from '../../components/data/DataTable';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { Card } from '../../components/layout/Card';
import { KeyValueList } from '../../components/data/KeyValueList';
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

function formatDate(d?: string): string {
  if (!d) return '\u2014';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Form Submissions', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const formName = data?.formName || data?.name || 'Form';
  const submissions: any[] = useMemo(() => data?.submissions || [], [data]);

  const rows = useMemo(() => {
    return submissions.map((s, i) => {
      const contact = s.contactName || s.name || s.email || 'Anonymous';
      const date = s.createdAt
        ? formatDate(s.createdAt)
        : s.submittedAt ? formatDate(s.submittedAt) : '—';
      const fields = s.data || s.fields || s.answers || {};
      const preview = Object.entries(fields)
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      return { id: s.id || String(i), contact, date, preview: preview || '—', _idx: i };
    });
  }, [submissions]);

  const selectedSubmission = selectedIdx !== null ? submissions[selectedIdx] : null;
  const selectedFields = selectedSubmission
    ? Object.entries(selectedSubmission.data || selectedSubmission.fields || selectedSubmission.answers || {})
        .map(([k, v]) => ({ label: k, value: String(v) }))
    : [];

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <div>
      <DetailHeader
        title={formName}
        subtitle={`${submissions.length} submission${submissions.length !== 1 ? 's' : ''}`}
        status={submissions.length > 0 ? 'Active' : 'Empty'}
        statusVariant={submissions.length > 0 ? 'active' : 'draft'}
      />

      <SplitLayout ratio="67/33" gap="md">
        <div>
          <DataTable
            columns={[
              { key: 'contact', label: 'Contact', sortable: true },
              { key: 'date', label: 'Submitted', sortable: true, format: 'date' },
              { key: 'preview', label: 'Data Preview' },
            ]}
            rows={rows}
            emptyMessage="No submissions yet"
          />
        </div>

        <div>
          {selectedSubmission ? (
            <Card title="Submission Details" subtitle={rows[selectedIdx!]?.contact}>
              <KeyValueList items={selectedFields} />
            </Card>
          ) : (
            <Card title="Submission Details">
              <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>
                Click a row to view details
              </p>
            </Card>
          )}
        </div>
      </SplitLayout>
    </div>
  );
}
