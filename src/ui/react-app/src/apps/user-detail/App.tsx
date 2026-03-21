import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { KeyValueList } from '../../components/data/KeyValueList';
import { TagList } from '../../components/data/TagList';
import { Card } from '../../components/layout/Card';
import type { KeyValueItem, StatusVariant, TagItem } from '../../types';
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

  const { isConnected, error } = useApp({
    appInfo: { name: 'User Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const user = useMemo(() => {
    if (!data) return null;
    return data.user || data;
  }, [data]);

  const profileItems: KeyValueItem[] = useMemo(() => {
    if (!user) return [];
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || '—';
    return [
      { label: 'Full Name', value: name, bold: true },
      { label: 'Email', value: user.email || '—' },
      { label: 'Phone', value: user.phone || '—' },
      { label: 'Role', value: user.role || user.type || '—' },
      { label: 'Status', value: user.status || (user.active !== false ? 'Active' : 'Inactive') },
      { label: 'Joined', value: formatDate(user.createdAt) },
      { label: 'Last Login', value: formatDate(user.lastLogin || user.lastActive) },
      { label: 'Location', value: user.location || [user.city, user.state, user.country].filter(Boolean).join(', ') || '—' },
    ];
  }, [user]);

  const permissions: TagItem[] = useMemo(() => {
    if (!user) return [];
    const perms: string[] = user.permissions || [];
    const colorMap: Record<string, string> = {
      admin: 'red', write: 'blue', read: 'green', manage: 'purple', delete: 'red', create: 'indigo',
    };
    return perms.map((p: string) => {
      const key = Object.keys(colorMap).find((k) => p.toLowerCase().includes(k));
      return { label: p, color: (key ? colorMap[key] : 'gray') as any };
    });
  }, [user]);

  const roles: TagItem[] = useMemo(() => {
    if (!user) return [];
    const roleList: string[] = user.roles || (user.role ? [user.role] : []);
    return roleList.map((r: string) => ({ label: r, color: 'purple' as any }));
  }, [user]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name || 'User';
  const userRole = user?.role || user?.type || '';
  const status = user?.status || (user?.active !== false ? 'Active' : 'Inactive');
  const statusMap: Record<string, StatusVariant> = { active: 'active', inactive: 'paused', suspended: 'error', pending: 'pending' };
  const statusVariant: StatusVariant = statusMap[status.toLowerCase()] || 'active';

  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <DetailHeader
        title={displayName}
        subtitle={userRole}
        entityId={user?.id}
        status={status}
        statusVariant={statusVariant}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 22, fontWeight: 700,
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt={displayName} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
            ) : initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{user?.email || ''}</div>
            <div style={{ color: '#6b7280', fontSize: 14 }}>{user?.phone || ''}</div>
          </div>
        </div>
      </DetailHeader>

      <SplitLayout ratio="50/50" gap="md">
        <Card title="Profile Information">
          <KeyValueList items={profileItems} />
        </Card>

        <div>
          {roles.length > 0 && (
            <Card title="Roles">
              <TagList tags={roles} size="md" />
            </Card>
          )}

          <Card title={`Permissions${permissions.length > 0 ? ` (${permissions.length})` : ''}`}>
            {permissions.length > 0 ? (
              <TagList tags={permissions} size="md" />
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-icon">🔒</div>
                <p>No permissions assigned</p>
              </div>
            )}
          </Card>
        </div>
      </SplitLayout>
    </div>
  );
}
