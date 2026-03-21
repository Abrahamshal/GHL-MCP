import React from 'react';
import type { LineItemsTableProps } from '../../types.js';

function fmtCurrency(n: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

interface Props extends LineItemsTableProps {
  children?: React.ReactNode;
}

export const LineItemsTable: React.FC<Props> = ({ items = [], currency = 'USD' }) => {
  return (
    <div className="line-items-wrap">
      <table className="line-items-table">
        <thead>
          <tr>
            <th className="text-left">Item</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-secondary">{item.description}</div>
                )}
              </td>
              <td className="text-center text-secondary">{item.quantity}</td>
              <td className="text-right font-mono">{fmtCurrency(item.unitPrice, currency)}</td>
              <td className="text-right font-mono">{fmtCurrency(item.total, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
