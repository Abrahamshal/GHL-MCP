/**
 * social-calendar — Scheduled posts calendar view.
 * Calendar with post markers colored by platform, date filtering, platform/status filters.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { CalendarView } from '../../components/viz/CalendarView';
import { FilterChips } from '../../components/shared/FilterChips';
import { Card } from '../../components/layout/Card';
import { StatusBadge } from '../../components/data/StatusBadge';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface SocialPost {
  id?: string;
  title?: string;
  content?: string;
  platform?: string;
  status?: string;
  scheduledAt?: string;
  publishedAt?: string;
  accountName?: string;
}

interface CalendarData {
  posts: SocialPost[];
}

// ─── Constants ──────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  twitter: '#1DA1F2',
  tiktok: '#000000',
  google: '#4285F4',
};

const STATUS_VARIANTS: Record<string, 'pending' | 'complete' | 'error'> = {
  scheduled: 'pending',
  published: 'complete',
  failed: 'error',
};

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): CalendarData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as CalendarData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as CalendarData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<CalendarData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as CalendarData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'social-calendar', version: '1.0.0' },
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
          <SocialCalendarView posts={data.posts} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function SocialCalendarView({ posts }: { posts: SocialPost[] }) {
  const [platformFilters, setPlatformFilters] = useState<Set<string>>(new Set());
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get unique platforms and statuses
  const platforms = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.platform) set.add(p.platform); });
    return Array.from(set);
  }, [posts]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.status) set.add(p.status); });
    return Array.from(set);
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      if (platformFilters.size > 0 && p.platform && !platformFilters.has(p.platform)) return false;
      if (statusFilters.size > 0 && p.status && !statusFilters.has(p.status)) return false;
      return true;
    });
  }, [posts, platformFilters, statusFilters]);

  // Convert posts to calendar events
  const calendarEvents = useMemo(() => {
    return filteredPosts
      .filter(p => p.scheduledAt || p.publishedAt)
      .map(p => ({
        title: p.title || p.content?.slice(0, 30) || p.platform || 'Post',
        date: (p.scheduledAt || p.publishedAt)!,
        time: undefined,
        type: p.platform || 'post',
        color: PLATFORM_COLORS[p.platform?.toLowerCase() || ''] || '#6b7280',
      }));
  }, [filteredPosts]);

  // Posts for selected date
  const selectedDatePosts = useMemo(() => {
    if (!selectedDate) return [];
    return filteredPosts.filter(p => {
      const date = p.scheduledAt || p.publishedAt;
      if (!date) return false;
      try {
        return new Date(date).toISOString().slice(0, 10) === selectedDate;
      } catch { return false; }
    });
  }, [filteredPosts, selectedDate]);

  const handleDateClick = useCallback((date: string) => {
    setSelectedDate(prev => prev === date ? null : date);
  }, []);

  // Platform filter chips
  const platformChips = platforms.map(p => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    value: p,
    active: platformFilters.has(p),
  }));

  // Status filter chips
  const statusChips = statuses.map(s => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: s,
    active: statusFilters.has(s),
  }));

  return (
    <>
      <PageHeader
        title="Social Calendar"
        subtitle={`${filteredPosts.length} post${filteredPosts.length !== 1 ? 's' : ''}`}
        stats={platforms.map(p => ({
          label: p.charAt(0).toUpperCase() + p.slice(1),
          value: String(posts.filter(post => post.platform === p).length),
        }))}
      />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
        {platformChips.length > 0 && (
          <div className="filter-chips">
            {platformChips.map((c, i) => (
              <button
                key={c.value}
                className={`chip ${c.active ? 'chip-active' : ''}`}
                onClick={() => {
                  setPlatformFilters(prev => {
                    const next = new Set(prev);
                    if (next.has(c.value)) next.delete(c.value); else next.add(c.value);
                    return next;
                  });
                }}
                style={c.active ? { borderColor: PLATFORM_COLORS[c.value] || undefined } : undefined}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        {statusChips.length > 0 && (
          <div className="filter-chips">
            {statusChips.map(c => (
              <button
                key={c.value}
                className={`chip ${c.active ? 'chip-active' : ''}`}
                onClick={() => {
                  setStatusFilters(prev => {
                    const next = new Set(prev);
                    if (next.has(c.value)) next.delete(c.value); else next.add(c.value);
                    return next;
                  });
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <CalendarView
        events={calendarEvents}
        highlightToday
        onDateClick={handleDateClick}
      />

      {selectedDate && (
        <Card title={`Posts for ${selectedDate}`} padding="sm">
          {selectedDatePosts.length === 0 ? (
            <p className="text-muted" style={{ padding: 8, fontSize: 12 }}>No posts on this date</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selectedDatePosts.map((p, i) => (
                <div
                  key={p.id || i}
                  style={{
                    padding: '6px 8px',
                    borderLeft: `3px solid ${PLATFORM_COLORS[p.platform?.toLowerCase() || ''] || '#6b7280'}`,
                    background: '#f9fafb',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600 }}>
                      {p.platform?.charAt(0).toUpperCase()}{p.platform?.slice(1)}
                      {p.accountName ? ` · ${p.accountName}` : ''}
                    </span>
                    {p.status && (
                      <StatusBadge
                        label={p.status}
                        variant={STATUS_VARIANTS[p.status] || 'pending'}
                      />
                    )}
                  </div>
                  <div className="text-secondary">
                    {p.title || p.content?.slice(0, 80) || 'No content'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}
