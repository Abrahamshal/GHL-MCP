import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { KeyValueList } from '../../components/data/KeyValueList';
import { Timeline } from '../../components/data/Timeline';
import { Card } from '../../components/layout/Card';
import { ActionBar } from '../../components/shared/ActionBar';
import { ActionButton } from '../../components/shared/ActionButton';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import type { KeyValueItem, TimelineEvent, StatusVariant } from '../../types';
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

const statusMap: Record<string, StatusVariant> = {
  confirmed: 'active',
  booked: 'active',
  completed: 'complete',
  cancelled: 'error',
  no_show: 'error',
  pending: 'pending',
  rescheduled: 'paused',
};

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Appointment Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      setAppInstance(app);
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const appt = data?.appointment;
  const notes: any[] = data?.notes || [];

  const kvItems: KeyValueItem[] = useMemo(() => {
    if (!appt) return [];
    const items: KeyValueItem[] = [];

    if (appt.title || appt.name) items.push({ label: 'Title', value: appt.title || appt.name });

    // Date/time
    if (appt.startTime) {
      const start = new Date(appt.startTime);
      items.push({ label: 'Date', value: start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) });
      items.push({ label: 'Time', value: start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) });
    }

    if (appt.endTime && appt.startTime) {
      const start = new Date(appt.startTime).getTime();
      const end = new Date(appt.endTime).getTime();
      const mins = Math.round((end - start) / 60000);
      items.push({ label: 'Duration', value: mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m` });
    }

    // Contact
    const contactName = appt.contactName || appt.contact?.name ||
      [appt.contact?.firstName, appt.contact?.lastName].filter(Boolean).join(' ');
    if (contactName) items.push({ label: 'Contact', value: contactName, bold: true });
    if (appt.contact?.email || appt.email) items.push({ label: 'Email', value: appt.contact?.email || appt.email });
    if (appt.contact?.phone || appt.phone) items.push({ label: 'Phone', value: appt.contact?.phone || appt.phone });

    // Status
    if (appt.status || appt.appointmentStatus) {
      const s = appt.status || appt.appointmentStatus;
      items.push({ label: 'Status', value: s.charAt(0).toUpperCase() + s.slice(1), variant: statusMap[s.toLowerCase()] === 'error' ? 'danger' : statusMap[s.toLowerCase()] === 'active' ? 'success' : undefined });
    }

    // Calendar / location
    if (appt.calendarName || appt.calendar?.name) items.push({ label: 'Calendar', value: appt.calendarName || appt.calendar?.name });
    if (appt.locationName || appt.location) items.push({ label: 'Location', value: appt.locationName || appt.location });

    return items;
  }, [appt]);

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    return notes.map((note) => ({
      title: note.title || 'Note',
      description: note.body || note.content || note.text || '',
      timestamp: note.dateAdded || note.createdAt || note.date || '',
      icon: 'note' as const,
      variant: 'default' as const,
    }));
  }, [notes]);

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for appointment data...</p></div>;
  }

  const status = appt?.status || appt?.appointmentStatus || '';
  const statusVariant = statusMap[status.toLowerCase()] || 'active';

  return (
    <ChangeTrackerProvider>
      <MCPAppProvider app={appInstance}>
        <div>
          <DetailHeader
            title={appt?.title || appt?.name || 'Appointment'}
            subtitle={formatDate(appt?.startTime)}
            entityId={appt?.id}
            status={status ? status.charAt(0).toUpperCase() + status.slice(1) : undefined}
            statusVariant={statusVariant}
          />

          <Card title="Details" padding="sm">
            <KeyValueList items={kvItems} />
          </Card>

          {notes.length > 0 && (
            <Card title="Notes" padding="sm">
              <Timeline events={timelineEvents} />
            </Card>
          )}

          <ActionBar align="right">
            <ActionButton
              label="Edit"
              variant="secondary"
              size="sm"
              toolName="update_appointment"
              toolArgs={{ appointmentId: appt?.id }}
            />
            <ActionButton
              label="Cancel Appointment"
              variant="danger"
              size="sm"
              toolName="update_appointment"
              toolArgs={{ appointmentId: appt?.id, status: 'cancelled' }}
            />
            <ActionButton
              label="Add Note"
              variant="primary"
              size="sm"
              toolName="create_note"
              toolArgs={{ contactId: appt?.contactId, body: '' }}
            />
          </ActionBar>
        </div>
      </MCPAppProvider>
    </ChangeTrackerProvider>
  );
}
