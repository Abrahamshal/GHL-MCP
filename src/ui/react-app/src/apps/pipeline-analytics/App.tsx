import React, { useMemo, useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
import { DataTable } from '../../components/data/DataTable';
import { FunnelChart } from '../../components/charts/FunnelChart';
import { BarChart } from '../../components/charts/BarChart';
import { Card } from '../../components/layout/Card';
import { SplitLayout } from '../../components/layout/SplitLayout';
import type { FunnelStage, BarChartBar } from '../../types';
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Pipeline Analytics', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const analytics = useMemo(() => {
    if (!data) return null;

    const pipeline = data.pipeline || {};
    const opportunities: any[] = data.opportunities || [];
    const stages: any[] = pipeline.stages || data.stages || [];

    const totalValue = opportunities.reduce((sum, o) => sum + (o.monetaryValue || o.value || 0), 0);
    const dealCount = opportunities.length;
    const avgDeal = dealCount > 0 ? totalValue / dealCount : 0;
    const wonDeals = opportunities.filter((o) => o.status === 'won');
    const wonValue = wonDeals.reduce((sum, o) => sum + (o.monetaryValue || o.value || 0), 0);
    const winRate = dealCount > 0 ? (wonDeals.length / dealCount) * 100 : 0;

    // Funnel: count by stage
    const funnelStages: FunnelStage[] = stages.map((s) => {
      const count = opportunities.filter(
        (o) => o.stageId === s.id || o.pipelineStageId === s.id || o.stage === s.name
      ).length;
      return { label: s.name || s.title || 'Unknown', value: count };
    });

    // Bar chart: value by stage
    const valueBars: BarChartBar[] = stages.map((s) => {
      const stageOpps = opportunities.filter(
        (o) => o.stageId === s.id || o.pipelineStageId === s.id || o.stage === s.name
      );
      const val = stageOpps.reduce((sum, o) => sum + (o.monetaryValue || o.value || 0), 0);
      return { label: s.name || s.title || 'Unknown', value: val };
    });

    // Top opportunities
    const topOpps = [...opportunities]
      .sort((a, b) => (b.monetaryValue || b.value || 0) - (a.monetaryValue || a.value || 0))
      .slice(0, 10)
      .map((o) => ({
        id: o.id || '',
        name: o.name || 'Untitled',
        value: formatCurrency(o.monetaryValue || o.value || 0),
        stage: o.stageName || o.stage || '—',
        status: o.status || 'open',
        contact: o.contactName || o.contact?.name || '—',
      }));

    return {
      pipelineName: pipeline.name || 'Pipeline',
      totalValue,
      dealCount,
      avgDeal,
      wonValue,
      winRate,
      funnelStages,
      valueBars,
      topOpps,
    };
  }, [data]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data || !analytics) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader
      title={`${analytics.pipelineName} Analytics`}
      subtitle={`${analytics.dealCount} opportunities`}
    >
      <StatsGrid columns={4}>
        <MetricCard label="Total Pipeline" value={formatCurrency(analytics.totalValue)} color="blue" />
        <MetricCard label="Won Revenue" value={formatCurrency(analytics.wonValue)} color="green" />
        <MetricCard label="Avg Deal Size" value={formatCurrency(analytics.avgDeal)} color="purple" />
        <MetricCard
          label="Win Rate"
          value={`${analytics.winRate.toFixed(1)}%`}
          color={analytics.winRate >= 30 ? 'green' : 'yellow'}
          trend={analytics.winRate >= 30 ? 'up' : 'down'}
          trendValue={`${analytics.winRate.toFixed(0)}%`}
        />
      </StatsGrid>

      <div style={{ marginTop: 16 }}>
      <SplitLayout ratio="50/50" gap="md">
        <Card title="Stage Conversion Funnel">
          <FunnelChart stages={analytics.funnelStages} showDropoff title="" />
        </Card>
        <Card title="Value by Stage">
          <BarChart bars={analytics.valueBars} orientation="horizontal" showValues title="" />
        </Card>
      </SplitLayout>
      </div>

      <div style={{ marginTop: 16 }}>
      <Card title="Top Opportunities" subtitle="Sorted by value">
        <DataTable
          columns={[
            { key: 'name', label: 'Name', sortable: true },
            { key: 'value', label: 'Value', sortable: true },
            { key: 'stage', label: 'Stage', sortable: true },
            { key: 'status', label: 'Status', format: 'status', sortable: true },
            { key: 'contact', label: 'Contact' },
          ]}
          rows={analytics.topOpps}
          emptyMessage="No opportunities in this pipeline"
        />
      </Card>
      </div>
    </PageHeader>
  );
}
