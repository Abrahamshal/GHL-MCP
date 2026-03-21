/**
 * campaign-stats — Email campaign metrics dashboard.
 * Shows campaign stats as MetricCards, performance bar chart, and campaigns table.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
import { BarChart } from '../../components/charts/BarChart';
import { DataTable } from '../../components/data/DataTable';
import { StatusBadge } from '../../components/data/StatusBadge';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface Campaign {
  id?: string;
  name: string;
  status?: string;
  sent?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  bounced?: number;
  date?: string;
}

interface CampaignData {
  campaign?: Campaign;
  campaigns?: Campaign[];
}

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): CampaignData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as CampaignData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as CampaignData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<CampaignData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as CampaignData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'campaign-stats', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (createdApp) => {
      createdApp.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  if (error) {
    return <div className="error-state"><h3>Connection Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected || !app) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;
  }

  return (
    <MCPAppProvider app={app}>
      <ChangeTrackerProvider>
        <div id="app">
          <CampaignStatsView data={data} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function CampaignStatsView({ data }: { data: CampaignData }) {
  const campaigns = data.campaigns || (data.campaign ? [data.campaign] : []);
  const primary = data.campaign || campaigns[0];

  // Aggregate stats across all campaigns
  const totals = useMemo(() => {
    const t = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0 };
    for (const c of campaigns) {
      t.sent += c.sent || 0;
      t.delivered += c.delivered || 0;
      t.opened += c.opened || 0;
      t.clicked += c.clicked || 0;
      t.bounced += c.bounced || 0;
    }
    return t;
  }, [campaigns]);

  // Bar chart data: performance per campaign (or over time)
  const barData = useMemo(() => {
    return campaigns.slice(0, 10).map(c => ({
      label: c.name?.slice(0, 12) || 'Campaign',
      value: c.opened || 0,
      color: '#4f46e5',
    }));
  }, [campaigns]);

  // Table columns
  const columns = useMemo(() => [
    { key: 'name', label: 'Campaign', sortable: true },
    { key: 'status', label: 'Status', format: 'status' as const, sortable: true },
    { key: 'sent', label: 'Sent', sortable: true },
    { key: 'delivered', label: 'Delivered', sortable: true },
    { key: 'opened', label: 'Opened', sortable: true },
    { key: 'clicked', label: 'Clicked', sortable: true },
    { key: 'bounced', label: 'Bounced', sortable: true },
  ], []);

  const rows = campaigns.map((c, i) => ({
    id: c.id || String(i),
    name: c.name || 'Untitled',
    status: c.status || 'sent',
    sent: c.sent?.toLocaleString() || '0',
    delivered: c.delivered?.toLocaleString() || '0',
    opened: c.opened?.toLocaleString() || '0',
    clicked: c.clicked?.toLocaleString() || '0',
    bounced: c.bounced?.toLocaleString() || '0',
  }));

  const openRate = totals.sent > 0 ? ((totals.opened / totals.sent) * 100).toFixed(1) + '%' : '—';
  const clickRate = totals.sent > 0 ? ((totals.clicked / totals.sent) * 100).toFixed(1) + '%' : '—';

  return (
    <>
      <PageHeader
        title={primary?.name || 'Campaign Stats'}
        subtitle={`${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
        status={primary?.status}
        statusVariant={primary?.status === 'active' ? 'active' : primary?.status === 'complete' ? 'complete' : 'sent'}
      />

      <StatsGrid columns={3}>
        <MetricCard label="Sent" value={totals.sent.toLocaleString()} color="blue" />
        <MetricCard label="Open Rate" value={openRate} color="purple" trend={totals.opened > 0 ? 'up' : 'flat'} trendValue={totals.opened.toLocaleString()} />
        <MetricCard label="Click Rate" value={clickRate} color="green" trend={totals.clicked > 0 ? 'up' : 'flat'} trendValue={totals.clicked.toLocaleString()} />
      </StatsGrid>

      {barData.length > 1 && (
        <div style={{ marginTop: 16 }}>
        <BarChart
          title="Opens by Campaign"
          bars={barData}
          orientation="vertical"
          showValues
        />
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ marginTop: 16 }}>
        <DataTable
          columns={columns}
          rows={rows}
          pageSize={10}
          emptyMessage="No campaigns found"
        />
        </div>
      )}
    </>
  );
}
