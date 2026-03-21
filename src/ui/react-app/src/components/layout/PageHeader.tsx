import React from 'react';
import type { PageHeaderProps } from '../../types.js';

const statusColors: Record<string, string> = {
  active: 'status-active', complete: 'status-complete', paused: 'status-paused',
  draft: 'status-draft', error: 'status-error', sent: 'status-sent',
  paid: 'status-paid', pending: 'status-pending', open: 'status-open',
  won: 'status-won', lost: 'status-lost', abandoned: 'status-draft',
};

interface Props extends PageHeaderProps {
  children?: React.ReactNode;
}

export const PageHeader: React.FC<Props> = ({ title, subtitle, status, statusVariant, gradient, stats, children }) => {
  const statusCls = statusColors[statusVariant || 'active'] || 'status-active';

  if (gradient) {
    return (
      <div className="page-header-gradient">
        <div className="page-header-top">
          <div>
            <h1 className="page-header-title-light">{title}</h1>
            {subtitle && <p className="page-header-subtitle-light">{subtitle}</p>}
          </div>
          {status && <span className="badge-light">{status}</span>}
        </div>
        {stats && stats.length > 0 && (
          <div className="page-header-stats-light">
            {stats.map((s, i) => (
              <span key={i} className="stat-item-light">
                <span className="stat-value-light">{s.value}</span>{' '}
                <span className="stat-label-light">{s.label}</span>
              </span>
            ))}
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="page-header">
      <div className="page-header-top">
        <div>
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {status && <span className={`status-badge ${statusCls}`}>{status}</span>}
      </div>
      {stats && stats.length > 0 && (
        <div className="page-header-stats">
          {stats.map((s, i) => (
            <span key={i} className="stat-item">
              <span className="stat-value">{s.value}</span> {s.label}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
};
