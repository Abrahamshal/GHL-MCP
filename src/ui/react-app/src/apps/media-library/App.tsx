import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { MediaGallery } from '../../components/viz/MediaGallery';
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

type FileFilter = 'all' | 'image' | 'video' | 'document' | 'audio';

const filterOptions: { label: string; value: FileFilter }[] = [
  { label: '📁 All', value: 'all' },
  { label: '🖼️ Images', value: 'image' },
  { label: '🎬 Videos', value: 'video' },
  { label: '📄 Documents', value: 'document' },
  { label: '🎵 Audio', value: 'audio' },
];

function classifyFileType(type: string | undefined, name: string | undefined): string {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (t.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(n)) return 'image';
  if (t.includes('video') || /\.(mp4|mov|avi|webm|mkv)$/i.test(n)) return 'video';
  if (t.includes('audio') || /\.(mp3|wav|ogg|m4a|flac)$/i.test(n)) return 'audio';
  return 'document';
}

function formatFileSize(bytes: number | string | undefined): string {
  if (!bytes) return '-';
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(b)) return String(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(d: string | undefined): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FileFilter>('all');

  const { isConnected, error } = useApp({
    appInfo: { name: 'Media Library', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const items = useMemo(() => {
    const files: any[] = data?.files || data?.media || data?.items || [];
    return files
      .map((f) => {
        const fileType = classifyFileType(f.type || f.mimeType || f.fileType, f.name || f.title);
        return {
          title: f.name || f.title || f.fileName || 'Untitled',
          url: f.url || f.thumbnailUrl || '',
          thumbnailUrl: f.thumbnailUrl || f.url || '',
          fileType: fileType,
          fileSize: formatFileSize(f.size || f.fileSize),
          date: formatDate(f.uploadedAt || f.createdAt || f.date),
        };
      })
      .filter((item) => {
        if (filter !== 'all' && item.fileType !== filter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return item.title.toLowerCase().includes(q);
      });
  }, [data, search, filter]);

  const counts = useMemo(() => {
    const files: any[] = data?.files || data?.media || data?.items || [];
    const c: Record<string, number> = { all: files.length, image: 0, video: 0, document: 0, audio: 0 };
    files.forEach((f) => {
      const ft = classifyFileType(f.type || f.mimeType || f.fileType, f.name || f.title);
      c[ft] = (c[ft] || 0) + 1;
    });
    return c;
  }, [data]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <PageHeader title="Media Library" subtitle={`${items.length} file${items.length !== 1 ? 's' : ''}`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tab-group">
          {filterOptions.map((f) => (
            <button
              key={f.value}
              className={`tab ${filter === f.value ? 'tab-active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label} <span className="tab-count">{counts[f.value] || 0}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <input
          type="text"
          className="search-input"
          placeholder="Search files by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <MediaGallery items={items} columns={3} />
    </PageHeader>
  );
}
