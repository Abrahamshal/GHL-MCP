import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { KeyValueList } from '../../components/data/KeyValueList';
import { DataTable } from '../../components/data/DataTable';
import { Card } from '../../components/layout/Card';
import { TagList } from '../../components/data/TagList';
import type { KeyValueItem } from '../../types';
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

  const { isConnected, error } = useApp({
    appInfo: { name: 'Company Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const company = useMemo(() => {
    if (!data) return null;
    return data.company || data;
  }, [data]);

  const detailItems: KeyValueItem[] = useMemo(() => {
    if (!company) return [];
    return [
      { label: 'Industry', value: company.industry || '—' },
      { label: 'Website', value: company.website || company.domain || '—' },
      { label: 'Phone', value: company.phone || '—' },
      { label: 'Email', value: company.email || '—' },
      { label: 'Address', value: [company.address1, company.city, company.state, company.postalCode, company.country].filter(Boolean).join(', ') || '—' },
      { label: 'Description', value: company.description || '—' },
    ];
  }, [company]);

  const contacts = useMemo(() => {
    if (!company) return [];
    const list: any[] = company.contacts || company.associatedContacts || [];
    return list.map((c: any) => ({
      id: c.id || '',
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.name || 'Unknown',
      email: c.email || '—',
      phone: c.phone || '—',
      role: c.role || c.title || '—',
    }));
  }, [company]);

  const tags = useMemo(() => {
    if (!company) return [];
    return (company.tags || []).map((t: any) =>
      typeof t === 'string' ? t : t.label || t.name || String(t)
    );
  }, [company]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const statusLabel = company?.status || 'Active';
  const statusVariant = (statusLabel.toLowerCase() === 'active' ? 'active' : statusLabel.toLowerCase() === 'inactive' ? 'paused' : 'draft') as any;

  return (
    <div>
      <DetailHeader
        title={company?.name || 'Company'}
        subtitle={company?.industry || ''}
        entityId={company?.id}
        status={statusLabel}
        statusVariant={statusVariant}
      />

      {tags.length > 0 && (
        <div style={{ margin: '12px 0' }}>
          <TagList tags={tags} />
        </div>
      )}

      <SplitLayout ratio="33/67" gap="md">
        <Card title="Company Details">
          <KeyValueList items={detailItems} />
        </Card>

        <Card title={`Associated Contacts (${contacts.length})`}>
          <DataTable
            columns={[
              { key: 'name', label: 'Name', sortable: true, format: 'avatar' },
              { key: 'email', label: 'Email', format: 'email' },
              { key: 'phone', label: 'Phone', format: 'phone' },
              { key: 'role', label: 'Role', sortable: true },
            ]}
            rows={contacts}
            pageSize={10}
            emptyMessage="No contacts associated with this company"
          />
        </Card>
      </SplitLayout>
    </div>
  );
}
