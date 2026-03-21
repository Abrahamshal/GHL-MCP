/**
 * ChangeTrackerContext — Provides shared change-tracking state across
 * all interactive components. Tracks pending user changes, save status,
 * and provides methods to queue/clear changes.
 */
import React, { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

// ─── Types ──────────────────────────────────────────────────

export interface PendingChange {
  id: string;
  type: string;
  args: Record<string, any>;
  timestamp: number;
  description: string;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ChangeTrackerContextValue {
  /** All pending (unsaved) changes */
  changes: PendingChange[];
  /** Whether there are any pending changes */
  hasChanges: boolean;
  /** Current save status */
  saveStatus: SaveStatus;
  /** Last save error message */
  lastSaveError: string | null;
  /** Track a new change */
  trackChange: (change: Omit<PendingChange, "id" | "timestamp">) => void;
  /** Clear all pending changes */
  clearChanges: () => void;
  /** Get a human-readable summary of pending changes */
  getChangesSummary: () => string;
  /** Set the save status (used by auto-save) */
  setSaveStatus: (status: SaveStatus, error?: string | null) => void;
}

// ─── Context ────────────────────────────────────────────────

const ChangeTrackerContext = createContext<ChangeTrackerContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────

export function ChangeTrackerProvider({ children }: { children: ReactNode }) {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [saveStatus, setSaveStatusState] = useState<SaveStatus>("idle");
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);
  const idCounter = useRef(0);

  const trackChange = useCallback(
    (change: Omit<PendingChange, "id" | "timestamp">) => {
      idCounter.current += 1;
      const newChange: PendingChange = {
        ...change,
        id: `change-${idCounter.current}-${Date.now()}`,
        timestamp: Date.now(),
      };
      setChanges((prev) => [...prev, newChange]);
      // Reset save status when new changes come in
      setSaveStatusState("idle");
      setLastSaveError(null);
    },
    [],
  );

  const clearChanges = useCallback(() => {
    setChanges([]);
  }, []);

  const getChangesSummary = useCallback((): string => {
    if (changes.length === 0) return "No pending changes";
    const descriptions = changes.map((c) => `- ${c.description}`);
    return `${changes.length} change${changes.length === 1 ? "" : "s"}:\n${descriptions.join("\n")}`;
  }, [changes]);

  const setSaveStatus = useCallback((status: SaveStatus, error?: string | null) => {
    setSaveStatusState(status);
    if (error !== undefined) setLastSaveError(error);
    if (status === "saved") setLastSaveError(null);
  }, []);

  const value: ChangeTrackerContextValue = {
    changes,
    hasChanges: changes.length > 0,
    saveStatus,
    lastSaveError,
    trackChange,
    clearChanges,
    getChangesSummary,
    setSaveStatus,
  };

  return (
    <ChangeTrackerContext.Provider value={value}>
      {children}
    </ChangeTrackerContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────

export function useChangeTrackerContext(): ChangeTrackerContextValue {
  const ctx = useContext(ChangeTrackerContext);
  if (!ctx) {
    throw new Error("useChangeTrackerContext must be used within a ChangeTrackerProvider");
  }
  return ctx;
}
