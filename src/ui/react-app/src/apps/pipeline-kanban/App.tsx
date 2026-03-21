import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { KanbanBoard } from '../../components/data/KanbanBoard';
import type { KanbanColumn } from '../../types';
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d?: string): string {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function PipelineKanbanInner({ data }: { data: any }) {
  const pipeline = data.pipeline || {};
  const opportunities: any[] = data.opportunities || [];
  const stages: any[] = data.stages || pipeline.stages || [];

  const stats = useMemo(() => {
    const totalValue = opportunities.reduce((sum, o) => sum + (o.monetaryValue || o.value || 0), 0);
    const dealCount = opportunities.length;
    const avgDeal = dealCount > 0 ? totalValue / dealCount : 0;
    const wonCount = opportunities.filter((o) => o.status === 'won').length;
    return { totalValue, dealCount, avgDeal, wonCount };
  }, [opportunities]);

  const columns = useMemo((): KanbanColumn[] => {
    return stages.map((stage) => {
      const stageOpps = opportunities.filter(
        (o) => o.stageId === stage.id || o.pipelineStageId === stage.id || o.stage === stage.name
      );
      const stageValue = stageOpps.reduce((sum, o) => sum + (o.monetaryValue || o.value || 0), 0);
      return {
        id: stage.id,
        title: stage.name || stage.title || 'Unknown',
        count: stageOpps.length,
        totalValue: formatCurrency(stageValue),
        cards: stageOpps.map((o) => ({
          id: o.id,
          title: o.name || 'Untitled',
          subtitle: o.contactName || o.contact?.name || '',
          value: formatCurrency(o.monetaryValue || o.value || 0),
          date: formatDate(o.createdAt || o.dateAdded),
          status: o.status || 'open',
          statusVariant: o.status || 'open',
        })),
      };
    });
  }, [stages, opportunities]);

  return (
    <PageHeader
      title={pipeline.name || 'Pipeline'}
      subtitle={`${stats.dealCount} opportunities`}
    >
      <StatsGrid columns={4}>
        <MetricCard label="Total Value" value={formatCurrency(stats.totalValue)} color="green" />
        <MetricCard label="Deals" value={String(stats.dealCount)} color="blue" />
        <MetricCard label="Avg Deal Size" value={formatCurrency(stats.avgDeal)} color="purple" />
        <MetricCard label="Won" value={String(stats.wonCount)} color="green" trend="up" trendValue={`${stats.dealCount > 0 ? ((stats.wonCount / stats.dealCount) * 100).toFixed(0) : 0}%`} />
      </StatsGrid>

      {stats.dealCount === 0 ? (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <div className="empty-icon">📋</div>
          <p>No opportunities in this pipeline</p>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <KanbanBoard columns={columns} moveTool="update_opportunity" />
        </div>
      )}
    </PageHeader>
  );
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Pipeline Kanban', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      setAppInstance(app);
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <ChangeTrackerProvider>
      <MCPAppProvider app={appInstance}>
        <PipelineKanbanInner data={data} />
      </MCPAppProvider>
    </ChangeTrackerProvider>
  );
}
