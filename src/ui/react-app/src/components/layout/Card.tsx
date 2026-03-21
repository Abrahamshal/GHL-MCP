import React from 'react';
import type { CardProps } from '../../types.js';

interface Props extends CardProps {
  children?: React.ReactNode;
}

const padClasses: Record<string, string> = {
  none: 'p-0',
  sm: 'p-sm',
  md: 'p-md',
  lg: 'p-lg',
};

export const Card: React.FC<Props> = ({ title, subtitle, padding = 'md', noBorder, children }) => {
  const padCls = padClasses[padding] || 'p-md';

  return (
    <div className={`card${noBorder ? ' no-border' : ''}`}>
      {title && (
        <div className="card-header">
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className={`card-body ${padCls}`}>{children}</div>
    </div>
  );
};
