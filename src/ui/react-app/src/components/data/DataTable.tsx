import React, { useState, useMemo, useCallback } from 'react';
import type { DataTableProps, TableColumn } from '../../types.js';

// ─── Utility helpers ────────────────────────────────────

const avatarColors = ['#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
function getAvatarColor(name: string): string {
  return avatarColors[(name || '').charCodeAt(0) % avatarColors.length];
}
function getInitials(name: string): string {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Cell Formatter ─────────────────────────────────────

function FormatCell({ value, format }: { value: unknown; format?: string }): React.ReactElement {
  if (value === null || value === undefined) {
    return <span className="text-muted">—</span>;
  }

  switch (format) {
    case 'email':
      return <a href={`mailto:${String(value)}`} className="link">{String(value)}</a>;
    case 'phone':
      return <span className="text-secondary">{String(value)}</span>;
    case 'date':
      return <span className="text-sm text-secondary">{String(value)}</span>;
    case 'currency':
      return <span className="font-mono font-medium">{String(value)}</span>;
    case 'tags': {
      const tags = Array.isArray(value) ? value : [value];
      const visible = tags.slice(0, 3);
      return (
        <div className="tags">
          {visible.map((t, i) => <span key={i} className="tag">{String(t)}</span>)}
          {tags.length > 3 && <span className="tag tag-more">+{tags.length - 3}</span>}
        </div>
      );
    }
    case 'avatar': {
      const name = String(value);
      const color = getAvatarColor(name);
      return (
        <div className="avatar-cell">
          <div className="avatar" style={{ background: color }}>{getInitials(name)}</div>
          <span className="font-medium">{name}</span>
        </div>
      );
    }
    case 'status': {
      const s = String(value).toLowerCase();
      const cls = s.includes('active') ? 'status-complete'
        : s.includes('new') ? 'status-active'
        : s.includes('lost') ? 'status-error'
        : 'status-draft';
      return <span className={`status-badge ${cls}`}>{String(value)}</span>;
    }
    default:
      return <span>{String(value)}</span>;
  }
}

// ─── Props ──────────────────────────────────────────────

interface Props extends DataTableProps {
  children?: React.ReactNode;
  onRowClick?: (rowId: string) => void;
}

// ─── Component ──────────────────────────────────────────

export const DataTable: React.FC<Props> = ({
  columns = [], rows = [], selectable, emptyMessage, pageSize = 10, onRowClick,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = useCallback((col: TableColumn) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
    setCurrentPage(0);
  }, [sortKey]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>{emptyMessage || 'No data available'}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const start = currentPage * pageSize;
  const displayRows = sortedRows.slice(start, start + pageSize);

  return (
    <div className="data-table-wrap">
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="checkbox-col"><input type="checkbox" readOnly /></th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={col.sortable ? 'sortable' : ''}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => handleSort(col)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, ri) => (
              <tr
                key={row.id || ri}
                data-row-id={row.id || ''}
                className="clickable-row"
                title="Double-click to view details"
                onClick={() => row.id && onRowClick?.(row.id)}
              >
                {selectable && (
                  <td className="checkbox-col"><input type="checkbox" readOnly /></td>
                )}
                {columns.map(col => (
                  <td key={col.key}>
                    <FormatCell value={row[col.key]} format={col.format} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            {start + 1}–{Math.min(start + pageSize, sortedRows.length)} of {sortedRows.length}
          </span>
          <div className="pagination-buttons">
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
