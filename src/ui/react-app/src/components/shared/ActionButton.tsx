import React, { useState, useCallback } from "react";
import type { ActionButtonProps } from "../../types.js";
import { useMCPApp } from "../../context/MCPAppContext.js";

const btnVariantClasses: Record<string, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

const btnSizeClasses: Record<string, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  variant = "secondary",
  size = "md",
  disabled,
  toolName,
  toolArgs,
}) => {
  const { callTool } = useMCPApp();
  const [loading, setLoading] = useState(false);

  const vCls = btnVariantClasses[variant] || "btn-secondary";
  const sCls = btnSizeClasses[size] || "btn-md";

  const handleClick = useCallback(async () => {
    if (!toolName || loading || disabled) return;

    setLoading(true);
    try {
      await callTool(toolName, toolArgs || {});
    } catch {
      // error is handled by the context layer
    } finally {
      setLoading(false);
    }
  }, [toolName, toolArgs, loading, disabled, callTool]);

  return (
    <button
      className={`btn ${vCls} ${sCls}`}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading && (
        <span
          className="loading-spinner"
          style={{
            width: 14,
            height: 14,
            marginRight: 6,
            borderWidth: 2,
            display: "inline-block",
          }}
        />
      )}
      {label}
    </button>
  );
};
