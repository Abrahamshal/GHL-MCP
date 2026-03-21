import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import { ProgressBar } from '../../components/data/ProgressBar';
import '../../styles/base.css';
import '../../styles/interactive.css';

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

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

type FilterKey = 'status' | 'priority';

const STATUS_OPTIONS = ['All', 'pending', 'in_progress', 'completed', 'overdue'];
const PRIORITY_OPTIONS = ['All', 'low', 'medium', 'high'];

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Task Board', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const tasks: any[] = data?.tasks || [];

  const rows = useMemo(() => {
    return tasks
      .filter((t) => {
        if (statusFilter !== 'All' && t.status !== statusFilter) return false;
        if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
        return true;
      })
      .map((t) => ({
        id: t.id || '',
        title: t.title || 'Untitled',
        status: t.status || 'pending',
        priority: t.priority || 'medium',
        dueDate: formatDate(t.dueDate),
        assignee: t.assignedTo || t.assignee || '—',
        contact: t.contactName || t.contact || '—',
      }));
  }, [tasks, statusFilter, priorityFilter]);

  const completedCount = tasks.filter((t) => t.status === 'completed' || t.completed).length;

  const handleTaskAction = useCallback(async (action: string, taskData: Record<string, any>) => {
    if (!app) return;
    setIsActing(true);
    setActionResult(null);
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({ action, data: taskData }),
        }],
      });
      setActionResult({ type: 'success', msg: `✓ ${action.replace('_', ' ')} request sent` });
      setTimeout(() => setActionResult(null), 3000);
    } catch {
      setActionResult({ type: 'error', msg: '✗ Failed to send request' });
    } finally {
      setIsActing(false);
    }
  }, [app]);

  const handleToggleComplete = useCallback((taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    handleTaskAction('update_task', { taskId, status: newStatus });
  }, [handleTaskAction]);

  const handleCreateTask = useCallback(() => {
    handleTaskAction('create_task', {});
  }, [handleTaskAction]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader
      title="Task Board"
      subtitle={`${rows.length} task${rows.length !== 1 ? 's' : ''}`}
      stats={[
        { label: 'Total', value: String(tasks.length) },
        { label: 'Completed', value: String(completedCount) },
        { label: 'Remaining', value: String(tasks.length - completedCount) },
      ]}
    >
      <ProgressBar
        label="Completion"
        value={completedCount}
        max={tasks.length || 1}
        color="green"
      />

      {/* Action bar */}
      <div className="action-bar align-right" style={{ margin: '12px 0' }}>
        {actionResult && (
          <span style={{ color: actionResult.type === 'success' ? '#059669' : '#dc2626', fontSize: 13 }}>
            {actionResult.msg}
          </span>
        )}
        <button
          className="btn btn-primary btn-sm"
          onClick={handleCreateTask}
          disabled={isActing || !app}
        >
          + Create Task
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <div className="filter-chips">
          <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>Status:</span>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`chip ${statusFilter === s ? 'chip-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'All' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="filter-chips">
          <span style={{ fontSize: 12, color: '#6b7280', marginRight: 4 }}>Priority:</span>
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p}
              className={`chip ${priorityFilter === p ? 'chip-active' : ''}`}
              onClick={() => setPriorityFilter(p)}
            >
              {p === 'All' ? 'All' : p}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'title', label: 'Title', sortable: true },
          { key: 'status', label: 'Status', format: 'status', sortable: true },
          { key: 'priority', label: 'Priority', format: 'status', sortable: true },
          { key: 'dueDate', label: 'Due Date', format: 'date', sortable: true },
          { key: 'assignee', label: 'Assignee', sortable: true },
          { key: 'contact', label: 'Contact', sortable: true },
        ]}
        rows={rows}
        pageSize={20}
        emptyMessage="No tasks match the current filters"
      />

      {/* Quick task actions */}
      {rows.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: '28px' }}>Quick complete:</span>
          {rows.filter(r => r.status !== 'completed').slice(0, 5).map((r) => (
            <button
              key={r.id}
              className="chip"
              onClick={() => handleToggleComplete(r.id, r.status)}
              disabled={isActing}
              title={`Mark "${r.title}" as completed`}
            >
              ✓ {r.title.length > 20 ? r.title.slice(0, 20) + '…' : r.title}
            </button>
          ))}
        </div>
      )}
    </PageHeader>
  );
}
