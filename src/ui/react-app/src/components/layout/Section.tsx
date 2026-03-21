import React from 'react';
import type { SectionProps } from '../../types.js';

interface Props extends SectionProps {
  children?: React.ReactNode;
}

export const Section: React.FC<Props> = ({ title, description, children }) => {
  return (
    <div className="section">
      {title && (
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {description && <p className="section-desc">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
