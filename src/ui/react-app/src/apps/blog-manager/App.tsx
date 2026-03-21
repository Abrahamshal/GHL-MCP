/**
 * blog-manager — Blog posts table with search and filters.
 * Shows posts with title, author, status, site, dates. Client-side filtering and search.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable } from '../../components/data/DataTable';
import { StatusBadge } from '../../components/data/StatusBadge';
import { SearchBar } from '../../components/shared/SearchBar';
import { FilterChips } from '../../components/shared/FilterChips';
import '../../styles/base.css';
import '../../styles/interactive.css';

// ─── Types ──────────────────────────────────────────────────

interface BlogPost {
  id?: string;
  title?: string;
  author?: string;
  status?: string;
  site?: string;
  siteId?: string;
  publishedAt?: string;
  updatedAt?: string;
  slug?: string;
}

interface BlogSite {
  id: string;
  name: string;
}

interface BlogData {
  posts: BlogPost[];
  sites?: BlogSite[];
}

// ─── Extract data from tool result ──────────────────────────

function extractData(result: CallToolResult): BlogData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as BlogData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        try { return JSON.parse(item.text) as BlogData; } catch { /* skip */ }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<BlogData | null>(null);

  useEffect(() => {
    const d = (window as any).__MCP_APP_DATA__;
    if (d && !data) setData(d as BlogData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'blog-manager', version: '1.0.0' },
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
          <BlogManagerView data={data} app={app} />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}

// ─── View ───────────────────────────────────────────────────

function BlogManagerView({ data, app }: { data: BlogData; app: any }) {
  const { posts, sites = [] } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [siteFilter, setSiteFilter] = useState<Set<string>>(new Set());
  const [authorFilter, setAuthorFilter] = useState<Set<string>>(new Set());
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isActing, setIsActing] = useState(false);

  const handleBlogAction = useCallback(async (action: string, blogData: Record<string, any>) => {
    if (!app) return;
    setIsActing(true);
    setActionResult(null);
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({ action, data: blogData }),
        }],
      });
      setActionResult({ type: 'success', msg: `✓ ${action.replace('_', ' ')} request sent` });
      setTimeout(() => setActionResult(null), 3000);
    } catch {
      setActionResult({ type: 'error', msg: '✗ Failed to send request' });
    } finally {
      setIsActing(false);
    }
  }, [app]);

  // Derive unique values for filters
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.status) set.add(p.status); });
    return Array.from(set);
  }, [posts]);

  const uniqueSites = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.site) set.add(p.site); });
    return Array.from(set);
  }, [posts]);

  const uniqueAuthors = useMemo(() => {
    const set = new Set<string>();
    posts.forEach(p => { if (p.author) set.add(p.author); });
    return Array.from(set);
  }, [posts]);

  // Apply client-side filters and search
  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      // Status filter
      if (statusFilter.size > 0 && p.status && !statusFilter.has(p.status)) return false;
      // Site filter
      if (siteFilter.size > 0 && p.site && !siteFilter.has(p.site)) return false;
      // Author filter
      if (authorFilter.size > 0 && p.author && !authorFilter.has(p.author)) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = [p.title, p.author, p.site, p.slug]
          .filter(Boolean)
          .some(v => v!.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [posts, statusFilter, siteFilter, authorFilter, searchQuery]);

  const columns = useMemo(() => [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'author', label: 'Author', sortable: true },
    { key: 'status', label: 'Status', format: 'status' as const, sortable: true },
    { key: 'site', label: 'Site', sortable: true },
    { key: 'publishedAt', label: 'Published', format: 'date' as const, sortable: true },
    { key: 'updatedAt', label: 'Updated', format: 'date' as const, sortable: true },
  ], []);

  const rows = filteredPosts.map((p, i) => ({
    id: p.id || String(i),
    title: p.title || 'Untitled',
    author: p.author || '—',
    status: p.status || 'draft',
    site: p.site || '—',
    publishedAt: p.publishedAt || '—',
    updatedAt: p.updatedAt || '—',
  }));

  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;

  return (
    <>
      <PageHeader
        title="Blog Manager"
        subtitle={`${posts.length} post${posts.length !== 1 ? 's' : ''}`}
        stats={[
          { label: 'Published', value: String(publishedCount) },
          { label: 'Drafts', value: String(draftCount) },
          { label: 'Sites', value: String(sites.length || uniqueSites.length) },
        ]}
      />

      <div className="search-bar" style={{ marginBottom: 12 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {uniqueStatuses.length > 0 && (
          <div className="filter-chips">
            {uniqueStatuses.map(s => (
              <button
                key={s}
                className={`chip ${statusFilter.has(s) ? 'chip-active' : ''}`}
                onClick={() => {
                  setStatusFilter(prev => {
                    const next = new Set(prev);
                    if (next.has(s)) next.delete(s); else next.add(s);
                    return next;
                  });
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
        {uniqueSites.length > 1 && (
          <div className="filter-chips">
            {uniqueSites.map(s => (
              <button
                key={s}
                className={`chip ${siteFilter.has(s) ? 'chip-active' : ''}`}
                onClick={() => {
                  setSiteFilter(prev => {
                    const next = new Set(prev);
                    if (next.has(s)) next.delete(s); else next.add(s);
                    return next;
                  });
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {uniqueAuthors.length > 1 && (
          <div className="filter-chips">
            {uniqueAuthors.map(a => (
              <button
                key={a}
                className={`chip ${authorFilter.has(a) ? 'chip-active' : ''}`}
                onClick={() => {
                  setAuthorFilter(prev => {
                    const next = new Set(prev);
                    if (next.has(a)) next.delete(a); else next.add(a);
                    return next;
                  });
                }}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        pageSize={10}
        emptyMessage="No blog posts found"
      />

      {/* Blog post actions */}
      {filteredPosts.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {actionResult && (
            <div style={{ color: actionResult.type === 'success' ? '#059669' : '#dc2626', fontSize: 13, marginBottom: 8 }}>
              {actionResult.msg}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280', lineHeight: '28px' }}>Actions:</span>
            {filteredPosts.slice(0, 5).map((p, i) => (
              <span key={p.id || i} style={{ display: 'inline-flex', gap: 2 }}>
                {p.status === 'draft' && (
                  <button
                    className="chip"
                    onClick={() => handleBlogAction('publish_blog_post', { postId: p.id, title: p.title })}
                    disabled={isActing}
                    title={`Publish "${p.title}"`}
                    style={{ color: '#059669' }}
                  >
                    📢 Publish {(p.title || '').length > 15 ? (p.title || '').slice(0, 15) + '…' : p.title}
                  </button>
                )}
                <button
                  className="chip"
                  onClick={() => handleBlogAction('delete_blog_post', { postId: p.id, title: p.title })}
                  disabled={isActing}
                  title={`Delete "${p.title}"`}
                  style={{ color: '#dc2626' }}
                >
                  🗑 {(p.title || '').length > 15 ? (p.title || '').slice(0, 15) + '…' : p.title}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
