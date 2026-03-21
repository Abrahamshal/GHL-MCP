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

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Funnel List', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const funnels: any[] = useMemo(() => data?.funnels || [], [data]);

  const typeChips = useMemo(() => {
    const types = new Set<string>();
    funnels.forEach((f) => { if (f.type) types.add(f.type); });
    return Array.from(types).sort();
  }, [funnels]);

  const categoryChips = useMemo(() => {
    const cats = new Set<string>();
    funnels.forEach((f) => { if (f.category) cats.add(f.category); });
    return Array.from(cats).sort();
  }, [funnels]);

  const rows = useMemo(() => {
    return funnels
      .map((f) => ({
        id: f.id || '',
        name: f.name || 'Untitled',
        type: f.type || 'funnel',
        pages: f.steps?.length ?? f.pagesCount ?? f.pages ?? 0,
        category: f.category || '—',
        status: f.status || 'draft',
      }))
      .filter((r) => {
        if (activeType && r.type.toLowerCase() !== activeType.toLowerCase()) return false;
        if (activeCategory && r.category.toLowerCase() !== activeCategory.toLowerCase()) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      });
  }, [funnels, search, activeType, activeCategory]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Funnels & Websites" subtitle={`${rows.length} item${rows.length !== 1 ? 's' : ''}`}>
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search funnels by name, type, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {typeChips.length > 1 && (
          <div className="filter-chips">
            <span className="text-muted" style={{ fontSize: 12, marginRight: 4 }}>Type:</span>
            <button
              className={`chip ${!activeType ? 'chip-active' : ''}`}
              onClick={() => setActiveType(null)}
            >All</button>
            {typeChips.map((t) => (
              <button
                key={t}
                className={`chip ${activeType === t ? 'chip-active' : ''}`}
                onClick={() => setActiveType(activeType === t ? null : t)}
              >{t}</button>
            ))}
          </div>
        )}
        {categoryChips.length > 1 && (
          <div className="filter-chips">
            <span className="text-muted" style={{ fontSize: 12, marginRight: 4 }}>Category:</span>
            <button
              className={`chip ${!activeCategory ? 'chip-active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >All</button>
            {categoryChips.map((c) => (
              <button
                key={c}
                className={`chip ${activeCategory === c ? 'chip-active' : ''}`}
                onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              >{c}</button>
            ))}
          </div>
        )}
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', sortable: true },
          { key: 'type', label: 'Type', sortable: true },
          { key: 'pages', label: 'Pages', sortable: true },
          { key: 'category', label: 'Category', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
        ]}
        rows={rows}
        emptyMessage="No funnels found"
      />
    </PageHeader>
  );
}
