import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
import { DataTable } from '../../components/data/DataTable';
import { StatusBadge } from '../../components/data/StatusBadge';
import { CurrencyDisplay } from '../../components/data/CurrencyDisplay';
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

function formatCurrency(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return '$0.00';
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function formatPercent(val: number | string | undefined): string {
  if (val === undefined || val === null) return '0%';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return '0%';
  return `${n.toFixed(1)}%`;
}

const statusVariantMap: Record<string, string> = {
  active: 'active',
  paused: 'paused',
  draft: 'draft',
  completed: 'complete',
  ended: 'complete',
  inactive: 'draft',
};

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [search, setSearch] = useState('');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Affiliate Dashboard', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const stats = useMemo(() => {
    const s = data?.stats || data?.summary || {};
    return {
      totalAffiliates: s.totalAffiliates || s.affiliateCount || 0,
      activeCampaigns: s.activeCampaigns || s.campaignCount || 0,
      totalCommissions: s.totalCommissions || s.commissions || 0,
      conversionRate: s.conversionRate || s.conversion || 0,
    };
  }, [data]);

  const campaigns = useMemo(() => {
    const items: any[] = data?.campaigns || [];
    return items
      .map((c) => {
        const status = (c.status || 'active').toLowerCase();
        return {
          id: c.id || '',
          name: c.name || c.title || 'Untitled Campaign',
          status: status.charAt(0).toUpperCase() + status.slice(1),
          statusVariant: statusVariantMap[status] || 'draft',
          commissionType: c.commissionType || c.type || 'Percentage',
          earnings: formatCurrency(c.earnings || c.totalEarnings || c.revenue || 0),
          affiliates: c.affiliateCount || c.affiliates || 0,
        };
      })
      .filter((c) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.commissionType.toLowerCase().includes(q);
      });
  }, [data, search]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Affiliate Dashboard" subtitle="Manage your affiliate program">
      <StatsGrid columns={4}>
        <MetricCard
          label="Total Affiliates"
          value={stats.totalAffiliates.toLocaleString()}
          color="blue"
        />
        <MetricCard
          label="Active Campaigns"
          value={stats.activeCampaigns.toLocaleString()}
          color="green"
        />
        <MetricCard
          label="Total Commissions"
          value={formatCurrency(stats.totalCommissions)}
          color="purple"
        />
        <MetricCard
          label="Conversion Rate"
          value={formatPercent(stats.conversionRate)}
          color="yellow"
        />
      </StatsGrid>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#1f2937' }}>Campaigns</h3>
        <div className="search-bar" style={{ marginBottom: 12 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <DataTable
          columns={[
            { key: 'name', label: 'Campaign Name', sortable: true },
            { key: 'status', label: 'Status', format: 'status', sortable: true },
            { key: 'commissionType', label: 'Commission Type', sortable: true },
            { key: 'earnings', label: 'Earnings', format: 'currency', sortable: true },
            { key: 'affiliates', label: 'Affiliates', sortable: true },
          ]}
          rows={campaigns}
          pageSize={20}
          emptyMessage="No campaigns found"
        />
      </div>
    </PageHeader>
  );
}
