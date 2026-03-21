import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
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

interface TimeSlot {
  date: string;
  time: string;
  endTime?: string;
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Free Slots Finder', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const freeSlots = data?.freeSlots;
  const calendarId = data?.calendarId;

  // Normalize slots into a flat list grouped by date
  const slotsByDate: Record<string, TimeSlot[]> = useMemo(() => {
    if (!freeSlots) return {};
    const grouped: Record<string, TimeSlot[]> = {};

    // Handle various formats: array of slots or object with date keys
    let slotList: any[] = [];
    if (Array.isArray(freeSlots)) {
      slotList = freeSlots;
    } else if (freeSlots.slots) {
      slotList = freeSlots.slots;
    } else if (typeof freeSlots === 'object') {
      // Object keyed by date
      for (const [dateKey, times] of Object.entries(freeSlots)) {
        if (dateKey === 'calendarId') continue;
        const timesArr = Array.isArray(times) ? times : [];
        for (const t of timesArr) {
          const slot = typeof t === 'string' ? { date: dateKey, time: t } : { date: dateKey, ...t };
          slotList.push(slot);
        }
      }
    }

    for (const slot of slotList) {
      const dateStr = slot.date || (slot.startTime ? new Date(slot.startTime).toISOString().split('T')[0] : '');
      if (!dateStr) continue;
      const timeStr = slot.time || (slot.startTime ? new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '');
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push({ date: dateStr, time: timeStr, endTime: slot.endTime });
    }

    return grouped;
  }, [freeSlots]);

  const sortedDates = useMemo(() => Object.keys(slotsByDate).sort(), [slotsByDate]);
  const totalSlots = useMemo(() => sortedDates.reduce((acc, d) => acc + slotsByDate[d].length, 0), [sortedDates, slotsByDate]);

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for availability data...</p></div>;
  }

  return (
    <div>
      <PageHeader
        title="Available Time Slots"
        subtitle={calendarId ? `Calendar: ${calendarId}` : 'Find open times'}
        stats={[
          { label: 'Dates', value: String(sortedDates.length) },
          { label: 'Slots', value: String(totalSlots) },
        ]}
      />

      {sortedDates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <p>No available time slots found</p>
        </div>
      ) : (
        sortedDates.map((dateStr) => {
          const daySlots = slotsByDate[dateStr];
          const formattedDate = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });

          return (
            <Card key={dateStr} title={formattedDate} subtitle={`${daySlots.length} slots available`} padding="sm">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {daySlots.map((slot, i) => {
                  const slotKey = `${slot.date}-${slot.time}`;
                  const isSelected = selectedSlot === slotKey;
                  return (
                    <button
                      key={i}
                      className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setSelectedSlot(isSelected ? null : slotKey)}
                      style={{ minWidth: 90, fontSize: 13 }}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}

      {selectedSlot && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, margin: '8px 0', fontSize: 13, color: '#166534' }}>
          ✓ Selected: <strong>{selectedSlot.replace('-', ' at ')}</strong>
        </div>
      )}
    </div>
  );
}
