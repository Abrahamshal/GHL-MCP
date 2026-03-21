import React from 'react';
import type { InfoBlockProps } from '../../types.js';

interface Props extends InfoBlockProps {
  children?: React.ReactNode;
}

export const InfoBlock: React.FC<Props> = ({ label, name, lines = [] }) => {
  return (
    <div className="info-block">
      <h3 className="info-block-label">{label}</h3>
      <div className="info-block-name">{name}</div>
      <div className="info-block-lines">
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
};
