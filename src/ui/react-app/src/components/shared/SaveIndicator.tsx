/**
 * SaveIndicator — Floating indicator showing sync/save status.
 *
 * Displays:
 * - "All saved ✓" (green) — no pending changes
 * - "N unsaved changes" (yellow) — changes queued
 * - "Saving..." (blue spinner) — auto-save in progress
 * - "Save failed" (red) — with retry info
 *
 * Also runs the useAutoSave hook to trigger debounced saves.
 */
import React from "react";
import { useChangeTracker } from "../../hooks/useChangeTracker.js";
import { useAutoSave } from "../../hooks/useAutoSave.js";
import { useHostCapabilities } from "../../hooks/useHostCapabilities.js";

export const SaveIndicator: React.FC = () => {
  // Run auto-save logic
  useAutoSave(3000);

  const { changes, hasChanges, saveStatus, lastSaveError } = useChangeTracker();
  const { canCallTools } = useHostCapabilities();

  // Don't show indicator when host supports direct tool calls and no changes
  if (canCallTools && !hasChanges && saveStatus === "idle") {
    return null;
  }

  // Don't show when completely idle with no changes
  if (!hasChanges && saveStatus === "idle") {
    return null;
  }

  let content: React.ReactNode;
  let className = "save-indicator";

  if (saveStatus === "saving") {
    className += " save-indicator--saving";
    content = (
      <>
        <span className="save-indicator__spinner" />
        <span>Saving...</span>
      </>
    );
  } else if (saveStatus === "error") {
    className += " save-indicator--error";
    content = (
      <>
        <span className="save-indicator__icon">⚠️</span>
        <span>Save failed{lastSaveError ? `: ${lastSaveError}` : ""}</span>
      </>
    );
  } else if (saveStatus === "saved" && !hasChanges) {
    className += " save-indicator--saved";
    content = (
      <>
        <span className="save-indicator__icon">✓</span>
        <span>All saved</span>
      </>
    );
  } else if (hasChanges) {
    className += " save-indicator--pending";
    content = (
      <>
        <span className="save-indicator__icon">●</span>
        <span>
          {changes.length} unsaved change{changes.length === 1 ? "" : "s"}
        </span>
      </>
    );
  } else {
    return null;
  }

  return <div className={className}>{content}</div>;
};
