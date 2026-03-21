import React from 'react';
import type { DetailHeaderProps } from '../../types.js';

const statusColors: Record<string, string> = {
  active: 'status-active', complete: 'status-complete', paused: 'status-paused',
  draft: 'status-draft', error: 'status-error', sent: 'status-sent',
  paid: 'status-paid', pending: 'status-pending', open: 'status-open',
  won: 'status-won', lost: 'status-lost', abandoned: 'status-draft',
};

interface Props extends DetailHeaderProps {
  children?: React.ReactNode;
}

export const DetailHeader: React.FC<Props> = ({ title, subtitle, entityId, status, statusVariant, children }) => {
  const cls = statusColors[statusVariant || 'active'] || 'status-active';

  return (
    <div className="detail-header">
      <div className="detail-header-top">
        <div>
          <h1 className="detail-title">{title}</h1>
          {entityId && <p className="detail-entity-id">{entityId}</p>}
          {subtitle && <p className="detail-subtitle">{subtitle}</p>}
        </div>
        {status && <span className={`status-badge ${cls}`}>{status}</span>}
      </div>
      {children}
    </div>
  );
};
