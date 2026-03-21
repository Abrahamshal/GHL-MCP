import React from 'react';
import type { TimelineProps } from '../../types.js';

const variantBorderClasses: Record<string, string> = {
  default: 'tl-border-default', success: 'tl-border-success',
  warning: 'tl-border-warning', error: 'tl-border-error',
};

const iconMap: Record<string, string> = {
  email: '📧', phone: '📞', note: '📝', meeting: '📅', task: '✅', system: '⚙️',
};

interface Props extends TimelineProps {
  children?: React.ReactNode;
}

export const Timeline: React.FC<Props> = ({ events = [] }) => {
  return (
    <div className="timeline">
      <div className="timeline-line" />
      {events.map((e, i) => (
        <div key={i} className="timeline-item">
          <div className={`timeline-dot ${variantBorderClasses[e.variant || 'default'] || 'tl-border-default'}`}>
            {iconMap[e.icon || 'system'] || '•'}
          </div>
          <div className="timeline-content">
            <div className="timeline-title">{e.title}</div>
            {e.description && <div className="timeline-desc">{e.description}</div>}
            <div className="timeline-time">{e.timestamp}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
