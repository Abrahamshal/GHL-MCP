import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { KeyValueList } from '../../components/data/KeyValueList';
import { Card } from '../../components/layout/Card';
import { AudioPlayer } from '../../components/data/AudioPlayer';
import { TranscriptView } from '../../components/comms/TranscriptView';
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

function formatDuration(seconds: number | string | undefined): string {
  if (!seconds) return '0:00';
  const s = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(d: string | undefined): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch { return d; }
}

const statusVariantMap: Record<string, string> = {
  completed: 'complete',
  missed: 'error',
  voicemail: 'pending',
  busy: 'paused',
  'no-answer': 'draft',
  failed: 'error',
  active: 'active',
};

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Call Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const call = data?.call || data || {};
  const contactName = call.contactName || call.contact?.name || 'Unknown Contact';
  const status = (call.status || 'completed').toLowerCase();
  const direction = (call.direction || 'inbound').toLowerCase();
  const variant = statusVariantMap[status] || 'draft';

  const metadataItems = [
    { label: 'Direction', value: direction.charAt(0).toUpperCase() + direction.slice(1), bold: true },
    { label: 'From', value: call.from || '-' },
    { label: 'To', value: call.to || '-' },
    { label: 'Duration', value: formatDuration(call.duration), bold: true },
    { label: 'Date', value: formatDate(call.date || call.createdAt || call.startedAt) },
    { label: 'Status', value: status.charAt(0).toUpperCase() + status.slice(1) },
  ];

  if (call.source) metadataItems.push({ label: 'Source', value: call.source, bold: false });
  if (call.assignedTo) metadataItems.push({ label: 'Assigned To', value: call.assignedTo, bold: false });

  const hasRecording = !!(call.recordingUrl || call.recording);
  const transcript = call.transcript || call.transcription || [];
  const transcriptEntries = Array.isArray(transcript) ? transcript : [];

  return (
    <div>
      <DetailHeader
        title={contactName}
        subtitle={call.phone || call.from || call.to || ''}
        entityId={call.id ? `Call #${call.id}` : undefined}
        status={status.charAt(0).toUpperCase() + status.slice(1)}
        statusVariant={variant as any}
      />

      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <Card title="Call Details">
          <KeyValueList items={metadataItems} />
        </Card>

        {hasRecording && (
          <Card title="Recording">
            <AudioPlayer
              title={`Call with ${contactName}`}
              duration={formatDuration(call.duration)}
              type="recording"
            />
          </Card>
        )}

        {transcriptEntries.length > 0 ? (
          <Card title="Transcript">
            <TranscriptView
              entries={transcriptEntries.map((e: any) => ({
                speaker: e.speaker || e.speakerName || 'Unknown',
                speakerRole: e.speakerRole || e.role || 'customer',
                text: e.text || e.content || '',
                timestamp: e.timestamp || e.time || '',
              }))}
              title={`Call Transcript`}
              duration={formatDuration(call.duration)}
            />
          </Card>
        ) : (
          <Card title="Transcript">
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>No transcript available for this call</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
