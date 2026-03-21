import React, { useMemo } from 'react';
import type { EmailPreviewProps } from '../../types.js';

function sanitizeHtml(html: string): string {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '');
}

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  from,
  to,
  subject,
  date,
  body = '',
  cc,
  attachments = [],
}) => {
  const sanitizedBody = useMemo(() => sanitizeHtml(body), [body]);

  return (
    <div className="email-preview">
      <div className="email-header">
        <div className="email-subject">{subject}</div>
        <div className="email-header-row">
          <span className="email-label">From</span>
          <span className="email-value">{from}</span>
        </div>
        <div className="email-header-row">
          <span className="email-label">To</span>
          <span className="email-value">{to}</span>
        </div>
        {cc && (
          <div className="email-header-row">
            <span className="email-label">Cc</span>
            <span className="email-value">{cc}</span>
          </div>
        )}
        <div className="email-header-row">
          <span className="email-label">Date</span>
          <span className="email-value">{date}</span>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="email-attachments">
          {attachments.map((a, i) => (
            <div className="email-attachment" key={i}>
              📎 {a.name}
              {a.size && (
                <span className="text-muted"> ({a.size})</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="email-body"
        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
      />
    </div>
  );
};
