import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import type { TableColumn, TableRow } from '../../types';
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

const typeIcons: Record<string, string> = {
  sms: '💬',
  email: '📧',
  call: '📞',
  whatsapp: '📱',
  facebook: '👤',
  instagram: '📸',
};

const COLUMNS: TableColumn[] = [
  { key: 'contact', label: 'Contact', sortable: true, format: 'avatar' },
  { key: 'lastMessage', label: 'Last Message' },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'dateUpdated', label: 'Updated', sortable: true, format: 'date' },
  { key: 'unread', label: 'Status', format: 'status' },
];

type FilterType = 'all' | 'sms' | 'email' | 'call' | 'unread';

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Conversation List', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const conversations: any[] = data?.conversations || [];

  const rows: TableRow[] = useMemo(() => {
    return conversations.map((c) => {
      const contactName = c.contactName || c.contact?.name ||
        [c.contact?.firstName, c.contact?.lastName].filter(Boolean).join(' ') || c.email || c.phone || 'Unknown';
      const msgType = (c.type || c.messageType || 'sms').toLowerCase();
      const icon = typeIcons[msgType] || '💬';

      return {
        id: c.id || c.conversationId || '',
        contact: contactName,
        lastMessage: c.lastMessage || c.lastMessageBody || c.snippet || '—',
        type: `${icon} ${msgType.toUpperCase()}`,
        dateUpdated: c.dateUpdated || c.lastMessageDate || c.updatedAt || '—',
        unread: c.unreadCount > 0 ? `${c.unreadCount} New` : 'Read',
        _type: msgType,
        _unreadCount: c.unreadCount || 0,
      };
    });
  }, [conversations]);

  // Filter by type and search
  const filteredRows = useMemo(() => {
    let filtered = rows;
    if (activeFilter === 'unread') {
      filtered = filtered.filter((r) => r._unreadCount > 0);
    } else if (activeFilter !== 'all') {
      filtered = filtered.filter((r) => r._type === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          String(r.contact).toLowerCase().includes(q) ||
          String(r.lastMessage).toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [rows, activeFilter, searchQuery]);

  const unreadCount = rows.filter((r) => r._unreadCount > 0).length;

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: '💬 SMS', value: 'sms' },
    { label: '📧 Email', value: 'email' },
    { label: '📞 Calls', value: 'call' },
    { label: `Unread (${unreadCount})`, value: 'unread' },
  ];

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for conversations...</p></div>;
  }

  return (
    <div>
      <PageHeader
        title="Conversations"
        subtitle={`${conversations.length} conversations`}
        stats={[
          { label: 'Total', value: String(conversations.length) },
          { label: 'Unread', value: String(unreadCount) },
        ]}
      />

      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: 8 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter chips */}
      <div style={{ marginBottom: 12 }}>
        <div className="filter-chips">
          {filters.map((f) => (
            <button
              key={f.value}
              className={`chip ${activeFilter === f.value ? 'chip-active' : ''}`}
              onClick={() => setActiveFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 4 }}>
      <DataTable
        columns={COLUMNS}
        rows={filteredRows}
        emptyMessage="No conversations found"
        pageSize={15}
      />
      </div>
    </div>
  );
}
