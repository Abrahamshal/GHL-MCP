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
  if (!d) return '—';
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
    appInfo: { name: 'Company List', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const rows = useMemo(() => {
    const companies: any[] = data?.companies || [];
    return companies
      .map((c: any) => ({
        id: c.id || '',
        name: c.name || 'Unnamed Company',
        industry: c.industry || '—',
        website: c.website || c.domain || '—',
        contactsCount: c.contactsCount ?? c.contacts?.length ?? 0,
        createdAt: formatDate(c.createdAt),
      }))
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.industry.toLowerCase().includes(q) ||
          r.website.toLowerCase().includes(q)
        );
      });
  }, [data, search]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const totalCompanies = data?.companies?.length || 0;

  return (
    <PageHeader
      title="Companies"
      subtitle={`${totalCompanies} compan${totalCompanies !== 1 ? 'ies' : 'y'} total`}
      stats={[
        { label: 'Total', value: String(totalCompanies) },
        { label: 'Showing', value: String(rows.length) },
      ]}
    >
      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search companies by name, industry, or website…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Company Name', sortable: true, format: 'avatar' },
          { key: 'industry', label: 'Industry', sortable: true },
          { key: 'website', label: 'Website', sortable: true },
          { key: 'contactsCount', label: 'Contacts', sortable: true },
          { key: 'createdAt', label: 'Created', sortable: true, format: 'date' },
        ]}
        rows={rows}
        pageSize={25}
        emptyMessage="No companies found"
      />
    </PageHeader>
  );
}
