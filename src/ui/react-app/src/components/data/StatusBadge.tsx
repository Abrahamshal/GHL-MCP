import React from 'react';
import type { StatusBadgeProps } from '../../types.js';

const statusColors: Record<string, string> = {
  active: 'status-active', complete: 'status-complete', paused: 'status-paused',
  draft: 'status-draft', error: 'status-error', sent: 'status-sent',
  paid: 'status-paid', pending: 'status-pending', open: 'status-open',
  won: 'status-won', lost: 'status-lost', abandoned: 'status-draft',
};

interface Props extends StatusBadgeProps {
  children?: React.ReactNode;
}

export const StatusBadge: React.FC<Props> = ({ label, variant }) => {
  const cls = statusColors[variant || 'active'] || 'status-active';

  return (
    <span className={`status-badge ${cls}`}>{label}</span>
  );
};
