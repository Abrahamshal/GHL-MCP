/**
 * social-post-composer — Create/schedule social media posts.
 * Platform tabs, account selector, content editor, scheduling.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
import { TabGroup } from '../../components/shared/TabGroup';
import { SelectDropdown } from '../../components/interactive/SelectDropdown';
import { ActionButton } from '../../components/shared/ActionButton';
import { useSmartAction } from '../../hooks/useSmartAction';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface SocialAccount {
  id: string;
  name: string;
  platform: string;
  status?: string;
}

interface ComposerData {
  accounts?: SocialAccount[];
}

// ─── Constants ──────────────────────────────────────────────

const PLATFORMS = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Google', value: 'google' },
];

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): ComposerData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as ComposerData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as ComposerData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<ComposerData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as ComposerData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'social-post-composer', version: '1.0.0' },
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
  // Allow rendering even without data (accounts are optional)
  return (
    <MCPAppProvider app={app}>
      <ChangeTrackerProvider>
        <div id="app">
          <ComposerView accounts={data?.accounts || []} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function ComposerView({ accounts }: { accounts: SocialAccount[] }) {
  const [activePlatform, setActivePlatform] = useState('facebook');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [submitResult, setSubmitResult] = useState<'success' | 'queued' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { executeAction } = useSmartAction();

  // Filter accounts for selected platform
  const platformAccounts = accounts.filter(
    a => a.platform?.toLowerCase() === activePlatform
  );

  const accountOptions = platformAccounts.map(a => ({
    label: `${a.name}${a.status && a.status !== 'connected' ? ` (${a.status})` : ''}`,
    value: a.id,
  }));

  const handlePublish = useCallback(async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    const result = await executeAction({
      type: 'create_social_post',
      args: {
        platform: activePlatform,
        accountId: selectedAccountId || undefined,
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
      },
      description: `Create ${activePlatform} post: "${content.slice(0, 50)}..."`,
    });

    setIsSubmitting(false);
    setSubmitResult(result.queued ? 'queued' : result.success ? 'success' : null);
  }, [activePlatform, selectedAccountId, content, mediaUrl, executeAction]);

  const handleSchedule = useCallback(async () => {
    if (!content.trim() || !scheduleDate) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    const scheduledAt = scheduleTime
      ? `${scheduleDate}T${scheduleTime}`
      : `${scheduleDate}T09:00`;

    const result = await executeAction({
      type: 'schedule_social_post',
      args: {
        platform: activePlatform,
        accountId: selectedAccountId || undefined,
        content: content.trim(),
        mediaUrl: mediaUrl.trim() || undefined,
        scheduledAt,
      },
      description: `Schedule ${activePlatform} post for ${scheduledAt}`,
    });

    setIsSubmitting(false);
    setSubmitResult(result.queued ? 'queued' : result.success ? 'success' : null);
  }, [activePlatform, selectedAccountId, content, mediaUrl, scheduleDate, scheduleTime, executeAction]);

  return (
    <>
      <PageHeader title="Compose Social Post" subtitle="Create or schedule a post" />

      <TabGroup
        tabs={PLATFORMS}
        activeTab={activePlatform}
        switchTool={undefined}
      />

      <Card title={`${PLATFORMS.find(p => p.value === activePlatform)?.label || 'Post'} Details`}>
        {accountOptions.length > 0 && (
          <SelectDropdown
            label="Account"
            placeholder="Select account..."
            options={accountOptions}
            selectedValue={selectedAccountId}
            changeTool={undefined}
          />
        )}

        <div className="mcp-field" style={{ marginTop: 8 }}>
          <label className="mcp-field-label">Content</label>
          <textarea
            className="mcp-field-input fg-textarea"
            rows={4}
            placeholder={`Write your ${activePlatform} post...`}
            value={content}
            onChange={e => { setContent(e.target.value); setSubmitResult(null); }}
          />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, textAlign: 'right' }}>
            {content.length} characters
          </div>
        </div>

        <div className="mcp-field" style={{ marginTop: 4 }}>
          <label className="mcp-field-label">Media URL (optional)</label>
          <input
            type="url"
            className="mcp-field-input"
            placeholder="https://example.com/image.jpg"
            value={mediaUrl}
            onChange={e => setMediaUrl(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <div className="mcp-field" style={{ flex: 1 }}>
            <label className="mcp-field-label">Schedule Date</label>
            <input
              type="date"
              className="mcp-field-input"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
            />
          </div>
          <div className="mcp-field" style={{ flex: 1 }}>
            <label className="mcp-field-label">Schedule Time</label>
            <input
              type="time"
              className="mcp-field-input"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
            />
          </div>
        </div>

        <div className="action-bar align-right" style={{ marginTop: 12 }}>
          {submitResult === 'success' && <span style={{ color: '#059669', fontSize: 12 }}>✓ Done</span>}
          {submitResult === 'queued' && <span style={{ color: '#d97706', fontSize: 12 }}>● Queued</span>}
          <button
            className="btn btn-secondary btn-sm"
            disabled={!content.trim() || !scheduleDate || isSubmitting}
            onClick={handleSchedule}
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!content.trim() || isSubmitting}
            onClick={handlePublish}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      </Card>
    </>
  );
}
