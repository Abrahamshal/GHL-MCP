import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { DataTable } from '../../components/data/DataTable';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { Card } from '../../components/layout/Card';
import { KeyValueList } from '../../components/data/KeyValueList';
import { Timeline } from '../../components/data/Timeline';
import '../../styles/base.css';
import '../../styles/interactive.css';

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Survey Submissions', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const surveyName = data?.surveyName || data?.name || 'Survey';
  const submissions: any[] = useMemo(() => data?.submissions || data?.responses || [], [data]);

  const rows = useMemo(() => {
    return submissions.map((s, i) => {
      const contact = s.contactName || s.name || s.email || 'Anonymous';
      const date = s.createdAt
        ? formatDate(s.createdAt)
        : s.submittedAt ? formatDate(s.submittedAt) : '—';
      const answers = s.data || s.answers || s.fields || {};
      const answerCount = Object.keys(answers).length;
      return {
        id: s.id || String(i),
        contact,
        date,
        answers: `${answerCount} answer${answerCount !== 1 ? 's' : ''}`,
        _idx: i,
      };
    });
  }, [submissions]);

  const expandedSubmission = expandedId !== null
    ? submissions.find((_s: any, i: number) => (submissions[i]?.id || String(i)) === expandedId)
    : null;

  const expandedFields = expandedSubmission
    ? Object.entries(expandedSubmission.data || expandedSubmission.answers || expandedSubmission.fields || {})
        .map(([k, v]) => ({ label: k, value: String(v) }))
    : [];

  const timelineEvents = useMemo(() => {
    return submissions.slice(0, 10).map((s, i) => ({
      title: s.contactName || s.name || s.email || 'Anonymous',
      description: `Submitted ${Object.keys(s.data || s.answers || s.fields || {}).length} answers`,
      timestamp: s.createdAt
        ? formatDate(s.createdAt)
        : s.submittedAt ? formatDate(s.submittedAt) : '—',
      icon: 'note' as const,
      variant: 'default' as const,
    }));
  }, [submissions]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <div>
      <DetailHeader
        title={surveyName}
        subtitle={`${submissions.length} response${submissions.length !== 1 ? 's' : ''}`}
        status={submissions.length > 0 ? 'Active' : 'No Responses'}
        statusVariant={submissions.length > 0 ? 'active' : 'draft'}
      />

      <SplitLayout ratio="67/33" gap="md">
        <div>
          <DataTable
            columns={[
              { key: 'contact', label: 'Respondent', sortable: true },
              { key: 'date', label: 'Submitted', sortable: true, format: 'date' },
              { key: 'answers', label: 'Answers' },
            ]}
            rows={rows}
            emptyMessage="No survey responses yet"
          />

          {expandedSubmission && expandedFields.length > 0 && (
            <Card title="Response Details" subtitle={`From: ${expandedSubmission.contactName || expandedSubmission.name || 'Anonymous'}`}>
              <KeyValueList items={expandedFields} />
            </Card>
          )}
        </div>

        <Card title="Recent Activity">
          {timelineEvents.length > 0 ? (
            <Timeline events={timelineEvents} />
          ) : (
            <p className="text-muted" style={{ textAlign: 'center', padding: 24 }}>
              No recent activity
            </p>
          )}
        </Card>
      </SplitLayout>
    </div>
  );
}
