import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
import { CalendarView } from '../../components/viz/CalendarView';
import type { CalendarEvent } from '../../types';
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

const EVENT_TYPE_COLORS: Record<string, string> = {
  meeting: '#4f46e5',
  call: '#059669',
  task: '#d97706',
  deadline: '#dc2626',
  event: '#7c3aed',
  appointment: '#0891b2',
  reminder: '#ec4899',
};

const ALL_TYPES = Object.keys(EVENT_TYPE_COLORS);

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
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Calendar View', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const calendar = data?.calendar;
  const events: any[] = data?.events || [];

  // Map events to CalendarEvent format with color coding
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((evt) => {
      const eventType = (evt.type || evt.appointmentStatus || 'event').toLowerCase();
      return {
        title: evt.title || evt.name || evt.subject || 'Untitled',
        date: evt.startTime || evt.date || evt.dateAdded || '',
        time: evt.startTime
          ? new Date(evt.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : evt.time || '',
        type: eventType,
        color: EVENT_TYPE_COLORS[eventType] || '#4f46e5',
      };
    });
  }, [events]);

  // Filter events by active types
  const filteredEvents = useMemo(() => {
    if (activeFilters.size === 0) return calendarEvents;
    return calendarEvents.filter((e) => activeFilters.has(e.type || 'event'));
  }, [calendarEvents, activeFilters]);

  // Determine present event types
  const presentTypes = useMemo(() => {
    const types = new Set<string>();
    for (const e of calendarEvents) {
      types.add(e.type || 'event');
    }
    return Array.from(types);
  }, [calendarEvents]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return filteredEvents.filter((e) => {
      try {
        const eDate = new Date(e.date).toISOString().split('T')[0];
        return eDate === selectedDate;
      } catch {
        return false;
      }
    });
  }, [filteredEvents, selectedDate]);

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

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
    <div>
      <PageHeader
        title={calendar?.name || 'Calendar'}
        subtitle={calendar?.description || `${events.length} events`}
        stats={[
          { label: 'Events', value: String(filteredEvents.length) },
          ...(data.startDate ? [{ label: 'From', value: formatDate(data.startDate) }] : []),
          ...(data.endDate ? [{ label: 'To', value: formatDate(data.endDate) }] : []),
        ]}
      />

      {/* Filter chips */}
      {presentTypes.length > 1 && (
        <div style={{ margin: '8px 0 12px' }}>
          <div className="filter-chips">
            {presentTypes.map((type) => (
              <button
                key={type}
                className={`chip ${activeFilters.size === 0 || activeFilters.has(type) ? 'chip-active' : ''}`}
                onClick={() => toggleFilter(type)}
                style={{
                  borderColor: EVENT_TYPE_COLORS[type] || '#4f46e5',
                  ...(activeFilters.size === 0 || activeFilters.has(type)
                    ? { background: EVENT_TYPE_COLORS[type] || '#4f46e5', color: '#fff' }
                    : {}),
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      <Card padding="sm">
        <CalendarView
          events={filteredEvents}
          highlightToday
          onDateClick={(date) => setSelectedDate(date === selectedDate ? null : date)}
        />
      </Card>

      {/* Selected date detail */}
      {selectedDate && (
        <Card title={`Events on ${selectedDate}`} padding="sm">
          {selectedDateEvents.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📅</div><p>No events on this date</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedDateEvents.map((evt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#f9fafb',
                    borderRadius: 6,
                    borderLeft: `3px solid ${evt.color || '#4f46e5'}`,
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{evt.time || '—'}</span>
                  <span style={{ fontSize: 13 }}>{evt.title}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: evt.color || '#6b7280',
                      textTransform: 'capitalize',
                    }}
                  >
                    {evt.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
