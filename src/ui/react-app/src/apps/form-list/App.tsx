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
  const [activeType, setActiveType] = useState<string | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Form List', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const forms: any[] = useMemo(() => data?.forms || [], [data]);

  const typeChips = useMemo(() => {
    const types = new Set<string>();
    forms.forEach((f) => { if (f.type) types.add(f.type); });
    return Array.from(types).sort();
  }, [forms]);

  const rows = useMemo(() => {
    return forms
      .map((f) => ({
        id: f.id || '',
        name: f.name || 'Untitled Form',
        type: f.type || 'form',
        submissions: f.submissions ?? f.submissionCount ?? 0,
        createdAt: f.createdAt
          ? formatDate(f.createdAt)
          : f.dateAdded || '—',
      }))
      .filter((r) => {
        if (activeType && r.type.toLowerCase() !== activeType.toLowerCase()) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
      });
  }, [forms, search, activeType]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Forms" subtitle={`${rows.length} form${rows.length !== 1 ? 's' : ''}`}>
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search forms by name or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {typeChips.length > 1 && (
        <div className="filter-chips" style={{ marginBottom: 16 }}>
          <button
            className={`chip ${!activeType ? 'chip-active' : ''}`}
            onClick={() => setActiveType(null)}
          >
            All
          </button>
          {typeChips.map((t) => (
            <button
              key={t}
              className={`chip ${activeType === t ? 'chip-active' : ''}`}
              onClick={() => setActiveType(activeType === t ? null : t)}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={[
          { key: 'name', label: 'Form Name', sortable: true },
          { key: 'type', label: 'Type', sortable: true },
          { key: 'submissions', label: 'Submissions', sortable: true },
          { key: 'createdAt', label: 'Created', sortable: true, format: 'date' },
        ]}
        rows={rows}
        emptyMessage="No forms found"
      />
    </PageHeader>
  );
}
