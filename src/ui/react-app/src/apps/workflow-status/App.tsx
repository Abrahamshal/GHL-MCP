/**
 * workflow-status — All workflows list with stats and filters.
 * Shows workflow table with name, status, triggers, lastRun. Stats for total/active/draft.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { MetricCard } from '../../components/data/MetricCard';
import { DataTable } from '../../components/data/DataTable';
import { StatusBadge } from '../../components/data/StatusBadge';
import { FilterChips } from '../../components/shared/FilterChips';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface Workflow {
  id?: string;
  name?: string;
  status?: string;
  triggers?: string | string[];
  lastRun?: string;
  totalExecutions?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkflowData {
  workflows: Workflow[];
}

// ─── Helpers ────────────────────────────────────────────────

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): WorkflowData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as WorkflowData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as WorkflowData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<WorkflowData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as WorkflowData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'workflow-status', version: '1.0.0' },
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
          <WorkflowStatusView workflows={data.workflows} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function WorkflowStatusView({ workflows }: { workflows: Workflow[] }) {
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());

  // Stats
  const totalCount = workflows.length;
  const activeCount = workflows.filter(w => w.status === 'active').length;
  const draftCount = workflows.filter(w => w.status === 'draft').length;
  const inactiveCount = workflows.filter(w => w.status === 'inactive').length;

  // Unique statuses for filter chips
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    workflows.forEach(w => { if (w.status) set.add(w.status); });
    return Array.from(set);
  }, [workflows]);

  // Filtered workflows
  const filteredWorkflows = useMemo(() => {
    if (statusFilter.size === 0) return workflows;
    return workflows.filter(w => w.status && statusFilter.has(w.status));
  }, [workflows, statusFilter]);

  // Table
  const columns = useMemo(() => [
    { key: 'name', label: 'Workflow', sortable: true },
    { key: 'status', label: 'Status', format: 'status' as const, sortable: true },
    { key: 'triggers', label: 'Triggers', sortable: false },
    { key: 'lastRun', label: 'Last Run', format: 'date' as const, sortable: true },
    { key: 'executions', label: 'Executions', sortable: true },
  ], []);

  const rows = filteredWorkflows.map((w, i) => {
    const triggers = Array.isArray(w.triggers) ? w.triggers.join(', ') : (w.triggers || '—');
    return {
      id: w.id || String(i),
      name: w.name || 'Untitled Workflow',
      status: w.status || 'draft',
      triggers,
      lastRun: w.lastRun ? formatDate(w.lastRun) : 'Never',
      executions: w.totalExecutions?.toLocaleString() || '0',
    };
  });

  return (
    <>
      <PageHeader
        title="Workflows"
        subtitle={`${totalCount} workflow${totalCount !== 1 ? 's' : ''}`}
      />

      <StatsGrid columns={4}>
        <MetricCard label="Total" value={String(totalCount)} color="blue" />
        <MetricCard label="Active" value={String(activeCount)} color="green" />
        <MetricCard label="Draft" value={String(draftCount)} color="default" />
        {inactiveCount > 0 && (
          <MetricCard label="Inactive" value={String(inactiveCount)} color="yellow" />
        )}
      </StatsGrid>

      {uniqueStatuses.length > 1 && (
        <div className="filter-chips" style={{ margin: '12px 0' }}>
          {uniqueStatuses.map(s => (
            <button
              key={s}
              className={`chip ${statusFilter.has(s) ? 'chip-active' : ''}`}
              onClick={() => {
                setStatusFilter(prev => {
                  const next = new Set(prev);
                  if (next.has(s)) next.delete(s); else next.add(s);
                  return next;
                });
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        pageSize={10}
        emptyMessage="No workflows found"
      />
    </>
  );
}
