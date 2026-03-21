import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { DataTable } from '../../components/data/DataTable';
import { KeyValueList } from '../../components/data/KeyValueList';
import { Card } from '../../components/layout/Card';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
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
  if (!d) return '\u2014';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Funnel Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const funnel = data?.funnel || data;
  const funnelName = funnel?.name || 'Funnel';
  const funnelType = funnel?.type || 'funnel';
  const status = funnel?.status || 'draft';
  const pages: any[] = useMemo(() => funnel?.steps || funnel?.pages || [], [funnel]);

  const totalViews = useMemo(
    () => pages.reduce((sum: number, p: any) => sum + (p.views ?? p.visits ?? 0), 0),
    [pages]
  );
  const totalConversions = useMemo(
    () => pages.reduce((sum: number, p: any) => sum + (p.conversions ?? p.optIns ?? 0), 0),
    [pages]
  );
  const conversionRate = totalViews > 0
    ? ((totalConversions / totalViews) * 100).toFixed(1)
    : '0.0';

  const pageRows = useMemo(() => {
    return pages.map((p, i) => ({
      id: p.id || String(i),
      name: p.name || p.title || `Page ${i + 1}`,
      url: p.url || p.path || '—',
      views: p.views ?? p.visits ?? 0,
      conversions: p.conversions ?? p.optIns ?? 0,
      rate: (p.views ?? p.visits ?? 0) > 0
        ? `${(((p.conversions ?? p.optIns ?? 0) / (p.views ?? p.visits ?? 1)) * 100).toFixed(1)}%`
        : '—',
    }));
  }, [pages]);

  const metadataItems = useMemo(() => {
    const items = [
      { label: 'Type', value: funnelType },
      { label: 'Status', value: status },
      { label: 'Total Pages', value: String(pages.length) },
    ];
    if (funnel?.category) items.push({ label: 'Category', value: funnel.category });
    if (funnel?.createdAt) items.push({ label: 'Created', value: formatDate(funnel.createdAt) });
    if (funnel?.updatedAt) items.push({ label: 'Updated', value: formatDate(funnel.updatedAt) });
    if (funnel?.locationId) items.push({ label: 'Location ID', value: funnel.locationId });
    return items;
  }, [funnel, funnelType, status, pages.length]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const statusVariant = status === 'published' || status === 'active' ? 'active' as const
    : status === 'completed' ? 'complete' as const
    : 'draft' as const;

  return (
    <div>
      <DetailHeader
        title={funnelName}
        subtitle={`${funnelType} • ${pages.length} page${pages.length !== 1 ? 's' : ''}`}
        status={status}
        statusVariant={statusVariant}
      />

      <StatsGrid columns={3}>
        <MetricCard label="Total Views" value={totalViews.toLocaleString()} color="blue" />
        <MetricCard label="Total Conversions" value={totalConversions.toLocaleString()} color="green" />
        <MetricCard label="Conversion Rate" value={`${conversionRate}%`} color="purple" />
      </StatsGrid>

      <div style={{ marginTop: 16 }}>
      <SplitLayout ratio="67/33" gap="md">
        <div>
          <Card title="Pages">
            <DataTable
              columns={[
                { key: 'name', label: 'Page Name', sortable: true },
                { key: 'url', label: 'URL' },
                { key: 'views', label: 'Views', sortable: true },
                { key: 'conversions', label: 'Conversions', sortable: true },
                { key: 'rate', label: 'Conv. Rate', sortable: true },
              ]}
              rows={pageRows}
              emptyMessage="No pages found"
            />
          </Card>
        </div>

        <div>
          <Card title="Funnel Details">
            <KeyValueList items={metadataItems} />
          </Card>
        </div>
      </SplitLayout>
      </div>
    </div>
  );
}
