import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
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
  const [search, setSearch] = useState('');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Survey List', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const surveys: any[] = useMemo(() => data?.surveys || [], [data]);

  const rows = useMemo(() => {
    return surveys
      .map((s) => {
        const status = s.status || 'draft';
        return {
          id: s.id || '',
          name: s.name || 'Untitled Survey',
          type: s.type || 'survey',
          responses: s.responses ?? s.responseCount ?? s.submissions ?? 0,
          status,
          createdAt: s.createdAt
            ? formatDate(s.createdAt)
            : s.dateAdded || '—',
        };
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q)
        );
      });
  }, [surveys, search]);

  const activeCount = rows.filter((r) => r.status === 'active' || r.status === 'published').length;
  const totalResponses = rows.reduce((sum, r) => sum + r.responses, 0);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader
      title="Surveys"
      subtitle={`${rows.length} survey${rows.length !== 1 ? 's' : ''}`}
      stats={[
        { label: 'Active', value: String(activeCount) },
        { label: 'Total Responses', value: totalResponses.toLocaleString() },
      ]}
    >
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search surveys by name, type, or status…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Survey Name', sortable: true },
          { key: 'type', label: 'Type', sortable: true },
          { key: 'responses', label: 'Responses', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
          { key: 'createdAt', label: 'Created', sortable: true, format: 'date' },
        ]}
        rows={rows}
        emptyMessage="No surveys found"
      />
    </PageHeader>
  );
}
