import React from "react";
import type { StockIndicatorProps } from "../../types.js";

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  quantity,
  lowThreshold = 10,
  criticalThreshold = 3,
  label,
}) => {
  let level: string;
  let levelCls: string;
  let icon: string;

  if (quantity <= criticalThreshold) {
    level = "Critical";
    levelCls = "stock-critical";
    icon = "🔴";
  } else if (quantity <= lowThreshold) {
    level = "Low";
    levelCls = "stock-low";
    icon = "🟡";
  } else {
    level = "In Stock";
    levelCls = "stock-ok";
    icon = "🟢";
  }

  return (
    <div className={`stock-indicator ${levelCls}`}>
      <div className="stock-icon">{icon}</div>
      <div className="stock-info">
        {label && <div className="stock-label">{label}</div>}
        <div className="stock-qty">{quantity} units</div>
        <div className="stock-level">{level}</div>
      </div>
    </div>
  );
};
