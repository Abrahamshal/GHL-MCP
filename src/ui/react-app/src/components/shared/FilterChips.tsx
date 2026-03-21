import React, { useState, useCallback } from "react";
import type { FilterChipsProps, FilterChip } from "../../types.js";
import { useMCPApp } from "../../context/MCPAppContext.js";

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips: initialChips = [],
  filterTool,
}) => {
  const { callTool } = useMCPApp();
  const [chips, setChips] = useState<FilterChip[]>(initialChips);

  const handleToggle = useCallback(
    (index: number) => {
      setChips((prev) => {
        const updated = prev.map((c, i) =>
          i === index ? { ...c, active: !c.active } : c,
        );

        // Fire tool call with active filter values
        if (filterTool) {
          const activeValues = updated
            .filter((c) => c.active)
            .map((c) => c.value || c.label);
          callTool(filterTool, { activeValues }).catch(() => {});
        }

        return updated;
      });
    },
    [filterTool, callTool],
  );

  return (
    <div className="filter-chips">
      {chips.map((c, i) => (
        <button
          key={`${c.label}-${i}`}
          className={`chip ${c.active ? "chip-active" : ""}`}
          onClick={() => handleToggle(i)}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
};
