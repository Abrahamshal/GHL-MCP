import React, { useMemo } from 'react';
import type { ContentPreviewProps } from '../../types.js';

function sanitizeHtml(html: string): string {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderMarkdown(md: string): string {
  return escapeHtml(md)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    .replace(/\n/g, '<br/>');
}

export const ContentPreview: React.FC<ContentPreviewProps> = ({
  content = '',
  format = 'html',
  maxHeight,
  title,
}) => {
  const rendered = useMemo(() => {
    if (format === 'html') {
      return sanitizeHtml(content);
    }
    if (format === 'markdown') {
      return renderMarkdown(content);
    }
    // text format
    return `<pre class="content-preview-pre">${escapeHtml(content)}</pre>`;
  }, [content, format]);

  const heightStyle: React.CSSProperties = maxHeight
    ? { maxHeight: `${maxHeight}px`, overflowY: 'auto' }
    : {};

  return (
    <div className="content-preview">
      {title && (
        <div className="content-preview-header">
          <h3 className="content-preview-title">{title}</h3>
        </div>
      )}
      <div
        className="content-preview-body"
        style={heightStyle}
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    </div>
  );
};
