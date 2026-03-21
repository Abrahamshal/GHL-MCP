import React, { useMemo } from 'react';
import type { DuplicateCompareProps, CompareRecord } from '../../types.js';

export const DuplicateCompare: React.FC<DuplicateCompareProps> = ({
  records = [],
  highlightDiffs = true,
  title,
}) => {
  if (records.length < 2) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <p>Need at least 2 records to compare</p>
      </div>
    );
  }

  const rec1 = records[0];
  const rec2 = records[1];

  const fields = useMemo(() => {
    const allFields = new Set<string>();
    for (const k of Object.keys(rec1.fields || {})) allFields.add(k);
    for (const k of Object.keys(rec2.fields || {})) allFields.add(k);
    return Array.from(allFields);
  }, [rec1, rec2]);

  return (
    <div className="dc-compare">
      {title && <div className="dc-title">{title}</div>}
      <div className="dc-header-row">
        <div className="dc-field dc-header-label">Field</div>
        <div className="dc-val dc-header-label">
          {rec1.label || 'Record A'}
        </div>
        <div className="dc-val dc-header-label">
          {rec2.label || 'Record B'}
        </div>
      </div>
      <div className="dc-body">
        {fields.map(f => {
          const v1 = (rec1.fields || {})[f] ?? '';
          const v2 = (rec2.fields || {})[f] ?? '';
          const isDiff = highlightDiffs && v1 !== v2;
          return (
            <div className="dc-row" key={f}>
              <div className="dc-field">{f}</div>
              <div className={`dc-val${isDiff ? ' dc-diff' : ''}`}>{v1}</div>
              <div className={`dc-val${isDiff ? ' dc-diff' : ''}`}>{v2}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
