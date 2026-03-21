import React from 'react';
import type { SplitLayoutProps } from '../../types.js';

interface Props extends SplitLayoutProps {
  children?: React.ReactNode;
}

const ratioClasses: Record<string, string> = {
  '50/50': 'split-50-50',
  '33/67': 'split-33-67',
  '67/33': 'split-67-33',
};

const gapClasses: Record<string, string> = {
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
};

export const SplitLayout: React.FC<Props> = ({ ratio = '50/50', gap = 'md', children }) => {
  const ratioCls = ratioClasses[ratio] || 'split-50-50';
  const gapCls = gapClasses[gap] || 'gap-md';

  return (
    <div className={`split-layout ${ratioCls} ${gapCls}`}>
      {children}
    </div>
  );
};
