import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
import { AppointmentBooker } from '../../components/interactive/AppointmentBooker';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
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

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Appointment Booker', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      setAppInstance(app);
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const calendar = data?.calendar;
  const contact = data?.contact;
  const locationId = data?.locationId;
  const slots = data?.slots;

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for calendar data...</p></div>;
  }

  return (
    <ChangeTrackerProvider>
      <MCPAppProvider app={appInstance}>
        <div>
          <PageHeader
            title="Book Appointment"
            subtitle={calendar?.name || 'Select a date and time'}
            stats={[
              ...(calendar?.name ? [{ label: 'Calendar', value: calendar.name }] : []),
              ...(contact ? [{ label: 'Contact', value: contact.name || contact.firstName || contact.email || 'Selected' }] : []),
            ]}
          />

          {/* Contact info card if pre-selected */}
          {contact && (
            <Card title="Contact" padding="sm">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>
                  {contact.name || [contact.firstName, contact.lastName].filter(Boolean).join(' ')}
                </div>
                {contact.email && <div style={{ color: '#6b7280' }}>📧 {contact.email}</div>}
                {contact.phone && <div style={{ color: '#6b7280' }}>📞 {contact.phone}</div>}
              </div>
            </Card>
          )}

          <Card padding="sm">
            <AppointmentBooker
              slots={slots}
              calendarId={calendar?.id || locationId}
              calendarTool="get_calendar_free_slots"
              bookTool="create_appointment"
              contactSearchTool="search_contacts"
            />
          </Card>
        </div>
      </MCPAppProvider>
    </ChangeTrackerProvider>
  );
}
