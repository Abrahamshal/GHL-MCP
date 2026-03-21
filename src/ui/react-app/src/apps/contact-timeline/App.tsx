import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { Timeline } from '../../components/data/Timeline';
import { Card } from '../../components/layout/Card';
import type { TimelineEvent } from '../../types';
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

type TabValue = 'all' | 'notes' | 'tasks' | 'appointments';

const TABS: { label: string; value: TabValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Notes', value: 'notes' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Appointments', value: 'appointments' },
];

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Contact Timeline', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const events = useMemo((): TimelineEvent[] => {
    if (!data) return [];

    const items: (TimelineEvent & { _sort: number })[] = [];

    const notes: any[] = data.notes || [];
    const tasks: any[] = data.tasks || [];
    const appointments: any[] = data.appointments || [];

    if (activeTab === 'all' || activeTab === 'notes') {
      for (const n of notes) {
        items.push({
          title: n.title || 'Note',
          description: n.body || n.description || '',
          timestamp: n.dateAdded || n.createdAt || '',
          icon: 'note',
          variant: 'default',
          _sort: new Date(n.dateAdded || n.createdAt || 0).getTime(),
        });
      }
    }

    if (activeTab === 'all' || activeTab === 'tasks') {
      for (const t of tasks) {
        const isComplete = t.status === 'completed' || t.completed;
        items.push({
          title: t.title || 'Task',
          description: t.description || t.body || '',
          timestamp: t.dueDate || t.dateAdded || '',
          icon: 'task',
          variant: isComplete ? 'success' : 'warning',
          _sort: new Date(t.dueDate || t.dateAdded || 0).getTime(),
        });
      }
    }

    if (activeTab === 'all' || activeTab === 'appointments') {
      for (const a of appointments) {
        items.push({
          title: a.title || 'Appointment',
          description: a.notes || a.description || '',
          timestamp: a.startTime || a.date || '',
          icon: 'meeting',
          variant: 'default',
          _sort: new Date(a.startTime || a.date || 0).getTime(),
        });
      }
    }

    return items
      .sort((a, b) => b._sort - a._sort)
      .map(({ _sort, ...ev }) => ev);
  }, [data, activeTab]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, notes: 0, tasks: 0, appointments: 0 };
    return {
      all: (data.notes?.length || 0) + (data.tasks?.length || 0) + (data.appointments?.length || 0),
      notes: data.notes?.length || 0,
      tasks: data.tasks?.length || 0,
      appointments: data.appointments?.length || 0,
    };
  }, [data]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const c = data.contact || {};
  const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Contact';

  return (
    <div>
      <DetailHeader
        title={fullName}
        subtitle="Activity Timeline"
        entityId={c.id}
        status={c.type || 'lead'}
        statusVariant="active"
      />

      <div className="tab-group" style={{ margin: '12px 0' }}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${t.value === activeTab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(t.value)}
          >
            {t.label}
            <span className="tab-count">{counts[t.value]}</span>
          </button>
        ))}
      </div>

      <Card>
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No {activeTab === 'all' ? 'activity' : activeTab} found</p>
          </div>
        ) : (
          <Timeline events={events} />
        )}
      </Card>
    </div>
  );
}
