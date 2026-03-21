import React, { useState, useCallback } from "react";
import type { ChecklistViewProps, ChecklistItem } from "../../types.js";
import { useMCPApp } from "../../context/MCPAppContext.js";

const priorityColors: Record<string, string> = {
  low: "#6b7280",
  medium: "#d97706",
  high: "#dc2626",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
};

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  items: initialItems = [],
  title,
  showProgress,
  toggleTool,
}) => {
  const { callTool } = useMCPApp();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);

  const handleToggle = useCallback(
    async (index: number) => {
      const item = items[index];
      const newCompleted = !item.completed;

      // Optimistic update
      setItems((prev) =>
        prev.map((it, i) =>
          i === index ? { ...it, completed: newCompleted } : it,
        ),
      );

      if (toggleTool) {
        try {
          await callTool(toggleTool, {
            itemTitle: item.title,
            completed: newCompleted,
          });
        } catch {
          // Revert on error
          setItems((prev) =>
            prev.map((it, i) =>
              i === index ? { ...it, completed: !newCompleted } : it,
            ),
          );
        }
      }
    },
    [items, toggleTool, callTool],
  );

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const pct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="checklist-view">
      {(title || showProgress) && (
        <div className="checklist-header">
          {title && <h3 className="checklist-title">{title}</h3>}
          {showProgress && (
            <div className="checklist-progress-wrap">
              <span className="checklist-progress-text">
                {completedCount}/{totalCount} done
              </span>
              <div className="checklist-progress-track">
                <div
                  className="checklist-progress-bar"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      <div className="checklist-body">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>No tasks</p>
          </div>
        ) : (
          items.map((item, i) => {
            const prColor =
              priorityColors[item.priority || "low"] || "#6b7280";
            const prLabel = priorityLabels[item.priority || ""] || "";

            return (
              <div
                key={i}
                className={`checklist-item ${item.completed ? "checklist-item-done" : ""}`}
                onClick={() => handleToggle(i)}
                style={{ cursor: "pointer" }}
              >
                <div
                  className={`checklist-checkbox ${item.completed ? "checklist-checkbox-checked" : ""}`}
                >
                  {item.completed && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="checklist-item-content">
                  <div
                    className={`checklist-item-title ${item.completed ? "checklist-item-title-done" : ""}`}
                  >
                    {item.title}
                  </div>
                  <div className="checklist-item-meta">
                    {item.dueDate && (
                      <span className="checklist-due">
                        📅 {item.dueDate}
                      </span>
                    )}
                    {item.assignee && (
                      <span className="checklist-assignee">
                        👤 {item.assignee}
                      </span>
                    )}
                    {prLabel && (
                      <span
                        className="checklist-priority"
                        style={{ color: prColor, borderColor: prColor }}
                      >
                        {prLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
