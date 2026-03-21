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

type FilterType = 'all' | 'inbound' | 'outbound' | 'missed';

const filterOptions: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Inbound', value: 'inbound' },
  { label: 'Outbound', value: 'outbound' },
  { label: 'Missed', value: 'missed' },
];

const statusMap: Record<string, { label: string; variant: string }> = {
  completed: { label: 'Completed', variant: 'complete' },
  missed: { label: 'Missed', variant: 'error' },
  voicemail: { label: 'Voicemail', variant: 'pending' },
  busy: { label: 'Busy', variant: 'paused' },
  'no-answer': { label: 'No Answer', variant: 'draft' },
  failed: { label: 'Failed', variant: 'error' },
};

function formatDuration(seconds: number | string | undefined): string {
  if (!seconds) return '0:00';
  const s = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(d: string | undefined): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Call Log', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const rows = useMemo(() => {
    const calls: any[] = data?.calls || data?.data || [];
    return calls
      .map((c) => {
        const status = (c.status || 'completed').toLowerCase();
        const direction = (c.direction || 'inbound').toLowerCase();
        const st = statusMap[status] || { label: status, variant: 'draft' };
        return {
          id: c.id || '',
          contactName: c.contactName || c.contact?.name || 'Unknown',
          phone: c.phone || c.to || c.from || '-',
          direction: direction.charAt(0).toUpperCase() + direction.slice(1),
          directionRaw: direction,
          duration: formatDuration(c.duration),
          status: st.label,
          statusVariant: st.variant,
          date: formatDate(c.date || c.createdAt || c.startedAt),
        };
      })
      .filter((r) => {
        if (filter === 'inbound' && r.directionRaw !== 'inbound') return false;
        if (filter === 'outbound' && r.directionRaw !== 'outbound') return false;
        if (filter === 'missed' && r.statusVariant !== 'error') return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return r.contactName.toLowerCase().includes(q) || r.phone.includes(q);
      });
  }, [data, search, filter]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Call Log" subtitle={`${rows.length} call${rows.length !== 1 ? 's' : ''}`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tab-group">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              className={`tab ${filter === f.value ? 'tab-active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by contact or phone number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'contactName', label: 'Contact', sortable: true, format: 'avatar' },
          { key: 'phone', label: 'Phone', format: 'phone' },
          { key: 'direction', label: 'Direction', sortable: true },
          { key: 'duration', label: 'Duration' },
          { key: 'status', label: 'Status', format: 'status', sortable: true },
          { key: 'date', label: 'Date', sortable: true },
        ]}
        rows={rows}
        pageSize={25}
        emptyMessage="No calls found"
      />
    </PageHeader>
  );
}
