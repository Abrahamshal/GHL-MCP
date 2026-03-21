import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import { StatusBadge } from '../../components/data/StatusBadge';
import type { StatusVariant } from '../../types';
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

const ROLE_FILTERS = ['All', 'Admin', 'User', 'Manager', 'Agent'] as const;

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
  const [roleFilter, setRoleFilter] = useState('All');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Team Management', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const rows = useMemo(() => {
    const users: any[] = data?.users || data?.members || data?.team || [];
    return users
      .filter((u: any) => {
        if (roleFilter !== 'All') {
          const role = (u.role || u.type || '').toLowerCase();
          if (role !== roleFilter.toLowerCase()) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase() || (u.name || '').toLowerCase();
          const email = (u.email || '').toLowerCase();
          const role = (u.role || u.type || '').toLowerCase();
          if (!name.includes(q) && !email.includes(q) && !role.includes(q)) return false;
        }
        return true;
      })
      .map((u: any) => {
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.name || 'Unknown';
        const status = u.status || (u.active !== false ? 'Active' : 'Inactive');
        return {
          id: u.id || '',
          name,
          email: u.email || '—',
          role: u.role || u.type || '—',
          status: status.charAt(0).toUpperCase() + status.slice(1),
          lastActive: formatDate(u.lastActive || u.lastLogin),
        };
      });
  }, [data, search, roleFilter]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const totalMembers = (data?.users || data?.members || data?.team || []).length;
  const activeCount = (data?.users || data?.members || data?.team || []).filter(
    (u: any) => (u.status || '').toLowerCase() === 'active' || u.active !== false
  ).length;

  return (
    <PageHeader
      title="Team Management"
      subtitle={`${totalMembers} team member${totalMembers !== 1 ? 's' : ''}`}
      stats={[
        { label: 'Total Members', value: String(totalMembers) },
        { label: 'Active', value: String(activeCount) },
        { label: 'Showing', value: String(rows.length) },
      ]}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search team members by name, email, or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              className={`chip ${roleFilter === r ? 'chip-active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', sortable: true, format: 'avatar' },
          { key: 'email', label: 'Email', format: 'email', sortable: true },
          { key: 'role', label: 'Role', sortable: true },
          { key: 'status', label: 'Status', format: 'status', sortable: true },
          { key: 'lastActive', label: 'Last Active', format: 'date', sortable: true },
        ]}
        rows={rows}
        pageSize={25}
        emptyMessage="No team members found"
      />
    </PageHeader>
  );
}
