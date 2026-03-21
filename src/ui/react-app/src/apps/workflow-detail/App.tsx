/**
 * workflow-detail — Single workflow flow diagram with metadata.
 * Shows FlowDiagram of trigger → actions → conditions → end, plus metadata.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { DetailHeader } from '../../components/data/DetailHeader';
import { FlowDiagram } from '../../components/viz/FlowDiagram';
import { KeyValueList } from '../../components/data/KeyValueList';
import { Card } from '../../components/layout/Card';
import type { FlowNode, FlowEdge, StatusVariant } from '../../types';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface WorkflowStep {
  id?: string;
  name?: string;
  type?: string;
  description?: string;
  nextSteps?: string[];
  condition?: string;
}

interface WorkflowDetail {
  id?: string;
  name?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  totalExecutions?: number;
  lastRun?: string;
  trigger?: string | { type?: string; name?: string; description?: string };
  steps?: WorkflowStep[];
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  description?: string;
}

interface WorkflowData {
  workflow: WorkflowDetail;
}

// ─── Constants ──────────────────────────────────────────────

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

const STATUS_MAP: Record<string, StatusVariant> = {
  active: 'active',
  draft: 'draft',
  inactive: 'paused',
  paused: 'paused',
  error: 'error',
};

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

// ─── Build flow diagram from workflow steps ─────────────────

function buildFlowFromSteps(workflow: WorkflowDetail): { nodes: FlowNode[]; edges: FlowEdge[] } {
  // If pre-built nodes/edges exist, use them
  if (workflow.nodes && workflow.nodes.length > 0) {
    return { nodes: workflow.nodes, edges: workflow.edges || [] };
  }

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Add trigger node
  const triggerName = typeof workflow.trigger === 'string'
    ? workflow.trigger
    : workflow.trigger?.name || workflow.trigger?.type || 'Trigger';
  const triggerDesc = typeof workflow.trigger === 'object'
    ? workflow.trigger.description
    : undefined;

  nodes.push({
    id: 'trigger',
    label: triggerName,
    description: triggerDesc,
    type: 'start',
  });

  // Add step nodes
  const steps = workflow.steps || [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const nodeId = step.id || `step-${i}`;
    const isCondition = step.type === 'condition' || step.type === 'if' || !!step.condition;

    nodes.push({
      id: nodeId,
      label: step.name || `Step ${i + 1}`,
      description: step.description || step.condition,
      type: isCondition ? 'condition' : 'action',
    });

    // Edge from previous node
    if (i === 0) {
      edges.push({ from: 'trigger', to: nodeId });
    } else {
      const prevId = steps[i - 1].id || `step-${i - 1}`;
      edges.push({ from: prevId, to: nodeId });
    }

    // Handle explicit nextSteps
    if (step.nextSteps) {
      for (const nextId of step.nextSteps) {
        edges.push({ from: nodeId, to: nextId, label: isCondition ? 'Yes' : undefined });
      }
    }
  }

  // Add end node
  if (steps.length > 0) {
    nodes.push({ id: 'end', label: 'End', type: 'end' });
    const lastStep = steps[steps.length - 1];
    const lastId = lastStep.id || `step-${steps.length - 1}`;
    // Only add edge if last step doesn't have explicit nextSteps
    if (!lastStep.nextSteps || lastStep.nextSteps.length === 0) {
      edges.push({ from: lastId, to: 'end' });
    }
  } else {
    // No steps — trigger directly to end
    nodes.push({ id: 'end', label: 'End', type: 'end' });
    edges.push({ from: 'trigger', to: 'end' });
  }

  return { nodes, edges };
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<WorkflowData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as WorkflowData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'workflow-detail', version: '1.0.0' },
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
          <WorkflowDetailView workflow={data.workflow} app={app} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function WorkflowDetailView({ workflow, app }: { workflow: WorkflowDetail; app: any }) {
  const w = workflow;
  const statusVariant = STATUS_MAP[w.status?.toLowerCase() || ''] || 'draft';
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const handleWorkflowAction = useCallback(async (action: string, actionData: Record<string, any>) => {
    if (!app) return;
    setIsActing(true);
    setActionResult(null);
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({ action, data: { workflowId: w.id, ...actionData } }),
        }],
      });
      setActionResult({ type: 'success', msg: `✓ ${action.replace('_', ' ')} request sent` });
      setTimeout(() => setActionResult(null), 3000);
    } catch {
      setActionResult({ type: 'error', msg: '✗ Failed to send request' });
    } finally {
      setIsActing(false);
    }
  }, [app, w.id]);

  // Build flow diagram
  const { nodes, edges } = useMemo(() => buildFlowFromSteps(w), [w]);

  // Metadata
  const metadataItems = [
    ...(w.status ? [{ label: 'Status', value: w.status.charAt(0).toUpperCase() + w.status.slice(1) }] : []),
    ...(w.createdAt ? [{ label: 'Created', value: formatDate(w.createdAt) }] : []),
    ...(w.updatedAt ? [{ label: 'Updated', value: formatDate(w.updatedAt) }] : []),
    ...(w.totalExecutions !== undefined ? [{ label: 'Total Executions', value: w.totalExecutions.toLocaleString(), bold: true as const }] : []),
    ...(w.lastRun ? [{ label: 'Last Run', value: formatDate(w.lastRun) }] : []),
    ...(w.id ? [{ label: 'Workflow ID', value: w.id, variant: 'muted' as const }] : []),
  ];

  return (
    <>
      <DetailHeader
        title={w.name || 'Workflow'}
        subtitle={w.description}
        entityId={w.id}
        status={w.status ? w.status.charAt(0).toUpperCase() + w.status.slice(1) : undefined}
        statusVariant={statusVariant}
      />

      <Card title="Flow" padding="sm">
        <FlowDiagram
          nodes={nodes}
          edges={edges}
          direction="vertical"
          title={undefined}
        />
      </Card>

      {metadataItems.length > 0 && (
        <Card title="Details" padding="sm">
          <KeyValueList items={metadataItems} />
        </Card>
      )}

      {/* Workflow Actions */}
      <div className="action-bar align-right" style={{ margin: '12px 0' }}>
        {actionResult && (
          <span style={{ color: actionResult.type === 'success' ? '#059669' : '#dc2626', fontSize: 13 }}>
            {actionResult.msg}
          </span>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleWorkflowAction('edit_workflow', { name: w.name })}
          disabled={isActing}
        >
          ✏️ Edit
        </button>
        {w.status?.toLowerCase() === 'active' ? (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleWorkflowAction('disable_workflow', { status: 'inactive' })}
            disabled={isActing}
          >
            ⏸ Disable
          </button>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleWorkflowAction('enable_workflow', { status: 'active' })}
            disabled={isActing}
          >
            ▶ Enable
          </button>
        )}
      </div>
    </>
  );
}
