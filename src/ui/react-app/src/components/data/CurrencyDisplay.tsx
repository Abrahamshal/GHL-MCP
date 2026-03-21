import React from "react";
import type { CurrencyDisplayProps } from "../../types.js";

const currencySizeClasses: Record<string, string> = {
  sm: "currency-sm",
  md: "currency-md",
  lg: "currency-lg",
};

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currency = "USD",
  locale = "en-US",
  size = "md",
  positive,
  negative,
}) => {
  const sizeCls = currencySizeClasses[size] || "currency-md";

  let colorCls = "";
  if (positive) colorCls = "currency-positive";
  else if (negative) colorCls = "currency-negative";
  else if (amount > 0) colorCls = "currency-positive";
  else if (amount < 0) colorCls = "currency-negative";

  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    formatted = `$${Number(amount).toFixed(2)}`;
  }

  return (
    <span className={`currency-display ${sizeCls} ${colorCls}`.trim()}>
      {formatted}
    </span>
  );
};
