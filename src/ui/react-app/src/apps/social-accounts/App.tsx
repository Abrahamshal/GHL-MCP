/**
 * social-accounts — Connected social media accounts view.
 * Card grid showing platform, account name, status, connection date.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { CardGrid } from '../../components/data/CardGrid';
import { StatusBadge } from '../../components/data/StatusBadge';
import type { CardGridItem, StatusVariant } from '../../types';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface SocialAccount {
  id?: string;
  name?: string;
  platform?: string;
  status?: string;
  connectedAt?: string;
  avatarUrl?: string;
  profileUrl?: string;
  followers?: number;
}

interface AccountsData {
  accounts: SocialAccount[];
}

// ─── Constants ──────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, string> = {
  facebook: '📘',
  instagram: '📷',
  linkedin: '💼',
  twitter: '🐦',
  tiktok: '🎵',
  google: '🔍',
  youtube: '▶️',
  pinterest: '📌',
};

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  connected: 'active',
  active: 'active',
  expired: 'paused',
  disconnected: 'error',
  pending: 'pending',
};

// ─── Helpers ────────────────────────────────────────────────

function formatDate(d?: string): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): AccountsData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as AccountsData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as AccountsData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<AccountsData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as AccountsData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'social-accounts', version: '1.0.0' },
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
          <SocialAccountsView accounts={data.accounts} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function SocialAccountsView({ accounts }: { accounts: SocialAccount[] }) {
  const connectedCount = accounts.filter(a => a.status === 'connected' || a.status === 'active').length;
  const expiredCount = accounts.filter(a => a.status === 'expired').length;
  const disconnectedCount = accounts.filter(a => a.status === 'disconnected').length;

  // Convert to CardGrid items
  const cards: CardGridItem[] = useMemo(() => {
    return accounts.map(a => {
      const icon = PLATFORM_ICONS[a.platform?.toLowerCase() || ''] || '🌐';
      const platformName = a.platform
        ? a.platform.charAt(0).toUpperCase() + a.platform.slice(1)
        : 'Unknown';
      const statusVariant = STATUS_VARIANTS[a.status?.toLowerCase() || ''] || 'pending';

      return {
        title: `${icon} ${platformName}`,
        subtitle: a.name || 'Unknown Account',
        description: a.connectedAt ? `Connected: ${formatDate(a.connectedAt)}` : undefined,
        imageUrl: a.avatarUrl,
        status: a.status
          ? a.status.charAt(0).toUpperCase() + a.status.slice(1)
          : 'Unknown',
        statusVariant: statusVariant as string,
      };
    });
  }, [accounts]);

  return (
    <>
      <PageHeader
        title="Social Accounts"
        subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected`}
        stats={[
          { label: 'Connected', value: String(connectedCount) },
          ...(expiredCount > 0 ? [{ label: 'Expired', value: String(expiredCount) }] : []),
          ...(disconnectedCount > 0 ? [{ label: 'Disconnected', value: String(disconnectedCount) }] : []),
        ]}
      />

      {accounts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <p>No social accounts connected</p>
        </div>
      ) : (
        <CardGrid cards={cards} columns={2} />
      )}
    </>
  );
}
