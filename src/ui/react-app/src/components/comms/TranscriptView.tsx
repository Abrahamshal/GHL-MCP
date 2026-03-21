import React from 'react';
import type { TranscriptViewProps, TranscriptEntry } from '../../types.js';

const speakerRoleColors: Record<string, string> = {
  agent: '#4f46e5',
  customer: '#059669',
  system: '#6b7280',
};

const speakerRoleLabels: Record<string, string> = {
  agent: 'Agent',
  customer: 'Customer',
  system: 'System',
};

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  entries = [],
  title,
  duration,
}) => {
  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📝</div>
        <p>No transcript available</p>
      </div>
    );
  }

  return (
    <div className="transcript-view">
      <div className="transcript-header">
        <div>
          {title && <h3 className="transcript-title">{title}</h3>}
        </div>
        <div className="transcript-meta">
          {duration && (
            <span className="transcript-duration">⏱ {duration}</span>
          )}
          <span className="transcript-count">{entries.length} entries</span>
        </div>
      </div>
      <div className="transcript-body">
        {entries.map((e: TranscriptEntry, i: number) => {
          const roleColor =
            speakerRoleColors[e.speakerRole || 'customer'] || '#6b7280';
          const roleLabel = speakerRoleLabels[e.speakerRole || ''] || '';

          return (
            <div className="transcript-entry" key={i}>
              <div className="transcript-timestamp">{e.timestamp}</div>
              <div className="transcript-content">
                <div className="transcript-speaker">
                  <span
                    className="transcript-speaker-dot"
                    style={{ background: roleColor }}
                  />
                  <span className="transcript-speaker-name">{e.speaker}</span>
                  {roleLabel && (
                    <span
                      className="transcript-role-badge"
                      style={{
                        color: roleColor,
                        background: `${roleColor}15`,
                      }}
                    >
                      {roleLabel}
                    </span>
                  )}
                </div>
                <div className="transcript-text">{e.text}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
