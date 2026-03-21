import React from "react";
import type { ActionBarProps } from "../../types.js";

const alignClasses: Record<string, string> = {
  left: "align-left",
  center: "align-center",
  right: "align-right",
};

export const ActionBar: React.FC<
  ActionBarProps & { children?: React.ReactNode }
> = ({ align = "right", children }) => {
  const alignCls = alignClasses[align] || "align-right";

  return <div className={`action-bar ${alignCls}`}>{children}</div>;
};
