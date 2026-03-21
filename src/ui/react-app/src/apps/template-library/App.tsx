import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import { Card } from '../../components/layout/Card';
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

function truncate(str: string, len: number): string {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

type TabValue = 'sms' | 'email';

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeTab, setActiveTab] = useState<TabValue>('sms');
  const [search, setSearch] = useState('');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Template Library', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const allTemplates = useMemo(() => {
    const templates: any[] = data?.templates || data?.data || [];
    return templates.map((t) => {
      const type = (t.type || t.templateType || 'sms').toLowerCase();
      return {
        id: t.id || '',
        name: t.name || t.title || 'Untitled Template',
        type: type.includes('email') ? 'email' : 'sms',
        typeLabel: type.includes('email') ? 'Email' : 'SMS',
        content: truncate(t.content || t.body || t.preview || t.subject || '', 100),
        createdDate: formatDate(t.createdAt || t.dateCreated || t.created),
      };
    });
  }, [data]);

  const counts = useMemo(() => {
    return {
      sms: allTemplates.filter((t) => t.type === 'sms').length,
      email: allTemplates.filter((t) => t.type === 'email').length,
    };
  }, [allTemplates]);

  const filtered = useMemo(() => {
    return allTemplates
      .filter((t) => t.type === activeTab)
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.content.toLowerCase().includes(q);
      });
  }, [allTemplates, activeTab, search]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Template Library" subtitle={`${allTemplates.length} template${allTemplates.length !== 1 ? 's' : ''}`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tab-group">
          <button
            className={`tab ${activeTab === 'sms' ? 'tab-active' : ''}`}
            onClick={() => { setActiveTab('sms'); setSearch(''); }}
          >
            💬 SMS <span className="tab-count">{counts.sms}</span>
          </button>
          <button
            className={`tab ${activeTab === 'email' ? 'tab-active' : ''}`}
            onClick={() => { setActiveTab('email'); setSearch(''); }}
          >
            📧 Email <span className="tab-count">{counts.email}</span>
          </button>
        </div>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="search-input"
            placeholder={`Search ${activeTab === 'sms' ? 'SMS' : 'email'} templates…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Template Name', sortable: true },
          { key: 'typeLabel', label: 'Type', sortable: true },
          { key: 'content', label: 'Preview' },
          { key: 'createdDate', label: 'Created', format: 'date', sortable: true },
        ]}
        rows={filtered}
        pageSize={20}
        emptyMessage={search
          ? `No ${activeTab === 'sms' ? 'SMS' : 'email'} templates match your search`
          : `No ${activeTab === 'sms' ? 'SMS' : 'email'} templates found`
        }
      />
    </PageHeader>
  );
}
