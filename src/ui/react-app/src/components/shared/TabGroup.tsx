import React, { useState, useCallback } from "react";
import type { TabGroupProps } from "../../types.js";
import { useMCPApp } from "../../context/MCPAppContext.js";

export const TabGroup: React.FC<TabGroupProps> = ({
  tabs = [],
  activeTab: controlledActiveTab,
  switchTool,
}) => {
  const { callTool } = useMCPApp();
  const [localActive, setLocalActive] = useState<string>(
    controlledActiveTab || tabs[0]?.value || "",
  );

  const activeTab = controlledActiveTab || localActive;

  const handleTabClick = useCallback(
    (value: string) => {
      setLocalActive(value);

      if (switchTool) {
        callTool(switchTool, { tab: value }).catch(() => {});
      }
    },
    [switchTool, callTool],
  );

  return (
    <div className="tab-group">
      {tabs.map((t) => (
        <button
          key={t.value}
          className={`tab ${t.value === activeTab ? "tab-active" : ""}`}
          onClick={() => handleTabClick(t.value)}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="tab-count">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};
