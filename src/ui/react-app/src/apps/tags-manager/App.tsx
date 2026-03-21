/**
 * Tags Manager — Tags list with search and visual preview.
 * Columns: name, color, usageCount, createdAt.
 * Client-side search. Visual tag preview with TagList component.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PageHeader } from "../../components/layout/PageHeader.js";
import { Section } from "../../components/layout/Section.js";
import { DataTable } from "../../components/data/DataTable.js";
import { TagList } from "../../components/data/TagList.js";
import { Card } from "../../components/layout/Card.js";
import type { TagColor } from "../../types.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface TagEntry {
  id?: string;
  name: string;
  color?: TagColor;
  usageCount?: number;
  createdAt?: string;
}

interface TagsManagerData {
  tags: TagEntry[];
}

// ─── Data Extraction ────────────────────────────────────────

function formatDate(d?: string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function extractData(result: CallToolResult): TagsManagerData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as TagsManagerData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as TagsManagerData;
        } catch {
          /* skip */
        }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = React.useState<TagsManagerData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "tags-manager", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (createdApp) => {
      createdApp.ontoolresult = async (result) => {
        const extracted = extractData(result);
        if (extracted) setData(extracted);
      };
    },
  });

  React.useEffect(() => {
    const preInjected = (window as any).__MCP_APP_DATA__;
    if (preInjected && !data) setData(preInjected as TagsManagerData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleTagAction = useCallback(async (action: string, tagData: Record<string, any>) => {
    if (!app) return;
    setIsActing(true);
    setActionResult(null);
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({ action, data: tagData }),
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

  const handleCreateTag = useCallback(() => {
    if (!newTagName.trim()) return;
    handleTagAction('create_tag', { name: newTagName.trim() });
    setNewTagName("");
    setShowCreateForm(false);
  }, [newTagName, handleTagAction]);

  const handleDeleteTag = useCallback((tagId: string, tagName: string) => {
    handleTagAction('delete_tag', { tagId, name: tagName });
  }, [handleTagAction]);

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    const tags = data?.tags ?? [];
    if (!searchQuery.trim()) return tags;
    const q = searchQuery.toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [data?.tags, searchQuery]);

  // Tag preview items for TagList component
  const tagPreviewItems = useMemo(
    () =>
      filteredTags.map((t) => ({
        label: t.name,
        color: t.color ?? ("blue" as TagColor),
        variant: "filled" as const,
      })),
    [filteredTags],
  );

  // Table rows
  const tableRows = useMemo(
    () =>
      filteredTags.map((t, idx) => ({
        id: t.id ?? `tag-${idx}`,
        name: t.name,
        color: t.color ?? "—",
        usageCount: t.usageCount ?? 0,
        createdAt: formatDate(t.createdAt),
      })),
    [filteredTags],
  );

  const tableColumns = useMemo(() => [
    { key: "name", label: "Tag Name", sortable: true },
    { key: "color", label: "Color", sortable: true },
    { key: "usageCount", label: "Usage Count", sortable: true },
    { key: "createdAt", label: "Created", sortable: true, format: "date" },
  ], []);

  // Stats
  const totalTags = data?.tags?.length ?? 0;
  const totalUsage = useMemo(
    () => (data?.tags ?? []).reduce((s, t) => s + (t.usageCount ?? 0), 0),
    [data?.tags],
  );
  const topTag = useMemo(() => {
    const tags = data?.tags ?? [];
    if (tags.length === 0) return "—";
    const sorted = [...tags].sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0));
    return sorted[0]?.name ?? "—";
  }, [data?.tags]);

  if (error) {
    return (
      <div className="error-state">
        <h3>Connection Error</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>{isConnected ? "Waiting for data..." : "Connecting..."}</p>
      </div>
    );
  }

  return (
    <div id="app" style={{ padding: 4 }}>
      <PageHeader
        title="Tags Manager"
        subtitle={`${totalTags} tags configured`}
        stats={[
          { label: "Total Tags", value: totalTags.toString() },
          { label: "Total Usage", value: totalUsage.toLocaleString() },
          { label: "Most Used", value: topTag },
        ]}
      />

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        <div className="search-bar" style={{ flex: 1, marginRight: 8 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actionResult && (
            <span style={{ color: actionResult.type === 'success' ? '#059669' : '#dc2626', fontSize: 13, whiteSpace: 'nowrap' }}>
              {actionResult.msg}
            </span>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {showCreateForm ? 'Cancel' : '+ Add Tag'}
          </button>
        </div>
      </div>

      {/* Create Tag Form */}
      {showCreateForm && (
        <Card title="Create Tag" padding="sm">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div className="mcp-field" style={{ flex: 1 }}>
              <label className="mcp-field-label">Tag Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                className="mcp-field-input"
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag(); }}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreateTag}
              disabled={!newTagName.trim() || isActing}
              style={{ marginBottom: 4 }}
            >
              {isActing ? 'Creating…' : 'Create'}
            </button>
          </div>
        </Card>
      )}

      {/* Tag Preview */}
      <Section title="Tag Preview">
        <TagList tags={tagPreviewItems} maxVisible={20} size="md" />
        {filteredTags.length > 20 && (
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
            Showing 20 of {filteredTags.length} tags
          </div>
        )}
      </Section>

      {/* Tags Table */}
      <Section title="All Tags">
        <DataTable
          columns={tableColumns}
          rows={tableRows}
          pageSize={15}
          emptyMessage={searchQuery ? "No tags match your search" : "No tags found"}
        />
      </Section>

      {/* Quick delete actions */}
      {filteredTags.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: '28px' }}>Quick delete:</span>
          {filteredTags.slice(0, 8).map((t, idx) => (
            <button
              key={t.id ?? `tag-${idx}`}
              className="chip"
              onClick={() => handleDeleteTag(t.id ?? '', t.name)}
              disabled={isActing}
              title={`Delete tag "${t.name}"`}
              style={{ color: '#dc2626' }}
            >
              🗑 {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
