import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { Card } from '../../components/layout/Card';
import { KeyValueList } from '../../components/data/KeyValueList';
import { AudioPlayer } from '../../components/data/AudioPlayer';
import { TranscriptView } from '../../components/comms/TranscriptView';
import type { KeyValueItem, TranscriptEntry, StatusVariant } from '../../types';
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

const typeIcons: Record<string, string> = {
  sms: '💬',
  email: '📧',
  call: '📞',
  whatsapp: '📱',
  voicemail: '📩',
};

const directionLabels: Record<string, string> = {
  inbound: 'Received',
  outbound: 'Sent',
  incoming: 'Received',
  outgoing: 'Sent',
};

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

  const { isConnected, error } = useApp({
    appInfo: { name: 'Message Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const message = data?.message;
  const recording = data?.recording;
  const transcription = data?.transcription;

  const msgType = (message?.type || message?.messageType || 'sms').toLowerCase();
  const icon = typeIcons[msgType] || '💬';
  const direction = message?.direction || 'inbound';
  const dirLabel = directionLabels[direction] || direction;

  const kvItems: KeyValueItem[] = useMemo(() => {
    if (!message) return [];
    const items: KeyValueItem[] = [];

    items.push({ label: 'Type', value: `${icon} ${msgType.toUpperCase()}` });
    items.push({ label: 'Direction', value: dirLabel });

    if (message.from || message.senderName) {
      items.push({ label: 'From', value: message.from || message.senderName, bold: true });
    }
    if (message.to || message.recipientName) {
      items.push({ label: 'To', value: message.to || message.recipientName });
    }
    if (message.contactName || message.contact?.name) {
      items.push({ label: 'Contact', value: message.contactName || message.contact?.name, bold: true });
    }
    if (message.subject) {
      items.push({ label: 'Subject', value: message.subject, bold: true });
    }
    if (message.dateAdded || message.createdAt || message.date) {
      const dateStr = message.dateAdded || message.createdAt || message.date;
      items.push({ label: 'Date', value: formatDate(dateStr) });
    }
    if (message.status) {
      items.push({
        label: 'Status',
        value: message.status.charAt(0).toUpperCase() + message.status.slice(1),
        variant: message.status === 'delivered' || message.status === 'read' ? 'success' : undefined,
      });
    }
    if (message.phone) {
      items.push({ label: 'Phone', value: message.phone });
    }
    if (message.email) {
      items.push({ label: 'Email', value: message.email });
    }

    return items;
  }, [message, msgType, icon, dirLabel]);

  const transcriptEntries: TranscriptEntry[] = useMemo(() => {
    if (!transcription?.entries && !transcription?.segments) return [];
    const entries = transcription.entries || transcription.segments || [];
    return entries.map((e: any) => ({
      speaker: e.speaker || e.speakerName || 'Unknown',
      speakerRole: e.speakerRole || e.role || 'customer',
      text: e.text || e.content || '',
      timestamp: e.timestamp || e.time || '',
    }));
  }, [transcription]);

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for message data...</p></div>;
  }

  const statusVariant: StatusVariant = message?.status === 'delivered' || message?.status === 'read'
    ? 'complete'
    : message?.status === 'failed' ? 'error' : 'active';

  return (
    <div>
      <DetailHeader
        title={`${icon} ${message?.subject || msgType.toUpperCase() + ' Message'}`}
        subtitle={`${dirLabel} · ${message?.dateAdded || message?.createdAt || ''}`}
        entityId={message?.id}
        status={message?.status ? message.status.charAt(0).toUpperCase() + message.status.slice(1) : undefined}
        statusVariant={statusVariant}
      />

      {/* Message content */}
      <Card title="Content" padding="sm">
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message?.body || message?.message || message?.content || message?.text || 'No content'}
        </div>
      </Card>

      {/* Metadata */}
      <Card title="Details" padding="sm">
        <KeyValueList items={kvItems} />
      </Card>

      {/* Recording */}
      {recording && (
        <Card title="Recording" padding="sm">
          <AudioPlayer
            title={recording.title || recording.name || 'Call Recording'}
            duration={recording.duration || recording.length || '0:00'}
            type={msgType === 'voicemail' ? 'voicemail' : 'recording'}
          />
        </Card>
      )}

      {/* Transcription */}
      {transcription && transcriptEntries.length > 0 && (
        <Card title="Transcription" padding="sm">
          <TranscriptView
            entries={transcriptEntries}
            title={transcription.title || 'Call Transcript'}
            duration={transcription.duration || recording?.duration}
          />
        </Card>
      )}
    </div>
  );
}
