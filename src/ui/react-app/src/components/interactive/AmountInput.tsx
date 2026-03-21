/**
 * AmountInput — Formatted currency input.
 * Shows formatted display ($1,234.56), raw number on focus, reformats on blur.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import type { AmountInputProps } from "../../types.js";

export const AmountInput: React.FC<AmountInputProps> = ({
  value = 0,
  currency = "USD",
  label,
  min,
  max,
}) => {
  const [rawValue, setRawValue] = useState<number>(value);
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const locale = "en-US";

  const format = useCallback(
    (num: number): string => {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      } catch {
        return `$${num.toFixed(2)}`;
      }
    },
    [currency],
  );

  // Sync from prop
  useEffect(() => {
    setRawValue(value);
    if (!isFocused) {
      setDisplayValue(format(value));
    }
  }, [value, format, isFocused]);

  // Initial format
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(format(rawValue));
    }
  }, [rawValue, format, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(rawValue === 0 ? "" : String(rawValue));
  };

  const handleBlur = () => {
    setIsFocused(false);
    let num = parseFloat(displayValue) || 0;
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    setRawValue(num);
    setDisplayValue(format(num));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits, decimal point, and negative sign
    if (/^-?\d*\.?\d*$/.test(val) || val === "") {
      setDisplayValue(val);
    }
  };

  return (
    <div className="amount-input-wrap">
      {label && <label className="mcp-field-label">{label}</label>}
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        className="mcp-field-input amount-input"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
};
