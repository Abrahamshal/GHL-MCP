import React from 'react';
import type { StatsGridProps } from '../../types.js';

interface Props extends StatsGridProps {
  children?: React.ReactNode;
}

export const StatsGrid: React.FC<Props> = ({ columns = 3, children }) => {
  return (
    <div className={`stats-grid stats-grid-${columns}`}>
      {children}
    </div>
  );
};
