import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { CardGrid } from '../../components/data/CardGrid';
import type { CardGridItem, StatusVariant } from '../../types';
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

const STATUS_OPTIONS = ['All', 'Published', 'Draft', 'Archived'] as const;

function mapStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (s === 'published' || s === 'active') return 'active';
  if (s === 'draft') return 'draft';
  if (s === 'archived') return 'complete';
  return 'pending';
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Course Catalog', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const cards: CardGridItem[] = useMemo(() => {
    const courses: any[] = data?.courses || [];
    return courses
      .filter((c: any) => {
        if (statusFilter !== 'All') {
          const cStatus = (c.status || 'draft').toLowerCase();
          if (cStatus !== statusFilter.toLowerCase()) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const title = (c.title || c.name || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          if (!title.includes(q) && !desc.includes(q)) return false;
        }
        return true;
      })
      .map((c: any) => {
        const lessonsCount = c.lessonsCount ?? c.lessons?.length ?? 0;
        const status = c.status || 'Draft';
        return {
          title: c.title || c.name || 'Untitled Course',
          subtitle: `${lessonsCount} lesson${lessonsCount !== 1 ? 's' : ''}`,
          description: c.description ? c.description.slice(0, 120) + (c.description.length > 120 ? '…' : '') : undefined,
          imageUrl: c.thumbnailUrl || c.thumbnail || c.imageUrl || undefined,
          status: status.charAt(0).toUpperCase() + status.slice(1),
          statusVariant: mapStatusVariant(status),
        };
      });
  }, [data, search, statusFilter]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const totalCourses = data?.courses?.length || 0;

  return (
    <PageHeader
      title="Course Catalog"
      subtitle={`${totalCourses} course${totalCourses !== 1 ? 's' : ''} available`}
      stats={[
        { label: 'Total', value: String(totalCourses) },
        { label: 'Showing', value: String(cards.length) },
      ]}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search courses by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`chip ${statusFilter === s ? 'chip-active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>No courses match your filters.</p>
        </div>
      ) : (
        <CardGrid cards={cards} columns={2} />
      )}
    </PageHeader>
  );
}
