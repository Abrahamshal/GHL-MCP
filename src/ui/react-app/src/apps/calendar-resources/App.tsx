import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import type { TableColumn, TableRow } from '../../types';
import '../../styles/base.css';

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

const COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'availability', label: 'Availability', sortable: true, format: 'status' },
];

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Calendar Resources', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const resources: any[] = data?.resources || [];

  const rows: TableRow[] = useMemo(() => {
    return resources.map((r) => ({
      id: r.id || r.resourceId || '',
      name: r.name || r.title || 'Unnamed',
      type: r.type || r.resourceType || r.category || '—',
      description: r.description || r.details || '—',
      availability: r.isAvailable !== undefined
        ? (r.isAvailable ? 'Available' : 'Unavailable')
        : r.availability || r.status || 'Unknown',
    }));
  }, [resources]);

  // Stats
  const available = rows.filter((r) => String(r.availability).toLowerCase() === 'available').length;
  const unavailable = rows.filter((r) => String(r.availability).toLowerCase() === 'unavailable').length;

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for resource data...</p></div>;
  }

  return (
    <div>
      <PageHeader
        title="Calendar Resources"
        subtitle="Rooms, equipment, and shared resources"
        stats={[
          { label: 'Total', value: String(rows.length) },
          { label: 'Available', value: String(available) },
          { label: 'Unavailable', value: String(unavailable) },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <DataTable
          columns={COLUMNS}
          rows={rows}
          emptyMessage="No resources found"
          pageSize={15}
        />
      </div>
    </div>
  );
}
