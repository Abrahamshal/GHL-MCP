import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import { StatusBadge } from '../../components/data/StatusBadge';
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

  const { isConnected, error } = useApp({
    appInfo: { name: 'Contact Grid', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const rows = useMemo(() => {
    const contacts: any[] = data?.contacts || [];
    return contacts
      .map((c) => ({
        id: c.id || '',
        name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown',
        email: c.email || '-',
        phone: c.phone || '-',
        tags: c.tags || [],
        dateAdded: c.dateAdded || c.createdAt || '-',
        source: c.source || '-',
      }))
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q) ||
          r.source.toLowerCase().includes(q)
        );
      });
  }, [data, search]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Contacts" subtitle={`${rows.length} result${rows.length !== 1 ? 's' : ''}`}>
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search contacts by name, email, phone, or source…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name', sortable: true, format: 'avatar' },
          { key: 'email', label: 'Email', format: 'email', sortable: true },
          { key: 'phone', label: 'Phone', format: 'phone' },
          { key: 'tags', label: 'Tags', format: 'tags' },
          { key: 'dateAdded', label: 'Date Added', format: 'date', sortable: true },
          { key: 'source', label: 'Source', sortable: true },
        ]}
        rows={rows}
        pageSize={25}
        emptyMessage="No contacts found"
      />
    </PageHeader>
  );
}
