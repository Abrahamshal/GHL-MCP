import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { TagList } from '../../components/data/TagList';
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

function formatDate(d: string | undefined): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

function extractFilterCriteria(list: any): string[] {
  if (list.filters && Array.isArray(list.filters)) {
    return list.filters.map((f: any) => {
      if (typeof f === 'string') return f;
      return `${f.field || f.key || ''} ${f.operator || '='} ${f.value || ''}`.trim();
    });
  }
  if (list.filterCriteria && typeof list.filterCriteria === 'string') {
    return list.filterCriteria.split(',').map((s: string) => s.trim());
  }
  if (list.criteria && Array.isArray(list.criteria)) {
    return list.criteria.map((c: any) => typeof c === 'string' ? c : c.label || c.name || JSON.stringify(c));
  }
  return [];
}

const tagColors: Array<'blue' | 'green' | 'purple' | 'yellow' | 'indigo' | 'pink'> = ['blue', 'green', 'purple', 'yellow', 'indigo', 'pink'];

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [search, setSearch] = useState('');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Smart List Viewer', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const rows = useMemo(() => {
    const lists: any[] = data?.smartLists || data?.lists || data?.data || [];
    return lists
      .map((l) => {
        const criteria = extractFilterCriteria(l);
        return {
          id: l.id || '',
          name: l.name || l.title || 'Untitled List',
          contactsCount: l.contactsCount || l.count || l.totalContacts || 0,
          filters: criteria,
          filtersDisplay: criteria.length > 0
            ? criteria.slice(0, 3).join(', ') + (criteria.length > 3 ? ` +${criteria.length - 3} more` : '')
            : 'No filters',
          createdDate: formatDate(l.createdAt || l.dateCreated || l.created),
          lastUpdated: formatDate(l.updatedAt || l.lastUpdated || l.modified),
        };
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.name.toLowerCase().includes(q) || r.filtersDisplay.toLowerCase().includes(q);
      });
  }, [data, search]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Smart Lists" subtitle={`${rows.length} list${rows.length !== 1 ? 's' : ''}`}>
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search smart lists…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>{search ? 'No smart lists match your search' : 'No smart lists found'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map((row) => (
            <div key={row.id || row.name} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{row.name}</h3>
                  <p className="text-secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                    {row.contactsCount.toLocaleString()} contact{row.contactsCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
                  <div>Created: {row.createdDate}</div>
                  <div>Updated: {row.lastUpdated}</div>
                </div>
              </div>
              {row.filters.length > 0 && (
                <TagList
                  tags={row.filters.map((f: string, i: number) => ({
                    label: f,
                    color: tagColors[i % tagColors.length],
                  }))}
                  maxVisible={5}
                  size="sm"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </PageHeader>
  );
}
