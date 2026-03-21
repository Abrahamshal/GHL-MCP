import React from 'react';
import type { KeyValueListProps } from '../../types.js';

interface Props extends KeyValueListProps {
  children?: React.ReactNode;
}

export const KeyValueList: React.FC<Props> = ({ items = [], compact }) => {
  return (
    <div className="kv-list">
      {items.map((item, i) => {
        let rowCls = 'kv-row';
        if (item.isTotalRow) rowCls += ' kv-total';
        else if (item.variant === 'success') rowCls += ' kv-success';
        else if (item.variant === 'highlight') rowCls += ' kv-highlight';
        else if (item.variant === 'muted') rowCls += ' kv-muted';
        if (compact) rowCls += ' kv-compact';

        let valueCls: string;
        if (item.isTotalRow) valueCls = 'kv-value-total';
        else if (item.bold) valueCls = 'kv-value-bold';
        else if (item.variant === 'danger') valueCls = 'kv-value-danger';
        else if (item.variant === 'success') valueCls = 'kv-value-success';
        else valueCls = 'kv-value';

        return (
          <div key={i} className={rowCls}>
            <span className="kv-label">{item.label}</span>
            <span className={valueCls}>{item.value}</span>
          </div>
        );
      })}
    </div>
  );
};
