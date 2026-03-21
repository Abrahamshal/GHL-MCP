/**
 * SelectDropdown — Static or tool-loaded select dropdown.
 * If loadTool is provided, fetches options on mount.
 *
 * Uses useSmartAction for change notifications, useCallTool for data loading.
 */
import React, { useState, useEffect } from "react";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import { useCallTool } from "../../hooks/useCallTool.js";
import type { SelectDropdownProps } from "../../types.js";

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options: staticOptions,
  selectedValue,
  label,
  placeholder = "Select...",
  loadTool,
  changeTool,
}) => {
  const [options, setOptions] = useState(staticOptions || []);
  const [currentValue, setCurrentValue] = useState(selectedValue || "");
  const [loadLoading, setLoadLoading] = useState(false);
  const { executeAction, canCallTools } = useSmartAction();
  const { execute: directExecute } = useCallTool();

  // Load options via tool on mount (only if host supports tool calls)
  useEffect(() => {
    if (!loadTool) return;

    if (canCallTools) {
      setLoadLoading(true);
      directExecute(loadTool, {}).then((res) => {
        if (res?.content) {
          for (const item of res.content) {
            if (item.type === "text") {
              try {
                const parsed = JSON.parse(item.text);
                const list = Array.isArray(parsed)
                  ? parsed
                  : parsed.options || parsed.data || parsed.results || [];
                setOptions(
                  list.map((o: any) => ({
                    label: o.label || o.name || o.title || String(o.value || o.id),
                    value: String(o.value || o.id),
                  })),
                );
              } catch {
                /* ignore */
              }
            }
          }
        }
        setLoadLoading(false);
      });
    }
  }, [loadTool, canCallTools, directExecute]);

  // Sync static options
  useEffect(() => {
    if (staticOptions) setOptions(staticOptions);
  }, [staticOptions]);

  // Sync selected value
  useEffect(() => {
    if (selectedValue !== undefined) setCurrentValue(selectedValue);
  }, [selectedValue]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const selectedLabel = options.find((o) => o.value === val)?.label || val;

    // Optimistic: update local state immediately
    setCurrentValue(val);

    if (changeTool) {
      await executeAction({
        type: changeTool,
        args: { value: val },
        description: `Changed ${label || "selection"} to "${selectedLabel}"`,
      });
    }
  };

  return (
    <div className="sd-wrap">
      {label && <label className="mcp-field-label">{label}</label>}
      <div className="sd-select-wrap">
        <select
          className="mcp-field-input sd-select"
          value={currentValue}
          onChange={handleChange}
          disabled={loadLoading}
        >
          <option value="" disabled>
            {loadLoading ? "Loading..." : placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="sd-chevron">▾</span>
      </div>
    </div>
  );
};
