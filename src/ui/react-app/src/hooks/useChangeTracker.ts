/**
 * useChangeTracker — Convenience hook that re-exports the shared
 * ChangeTrackerContext values.
 *
 * All interactive components share the same pending change queue
 * via the ChangeTrackerProvider in the component tree.
 */
import { useChangeTrackerContext } from "../context/ChangeTrackerContext.js";
import type { PendingChange, SaveStatus } from "../context/ChangeTrackerContext.js";

export type { PendingChange, SaveStatus };

export interface UseChangeTrackerReturn {
  changes: PendingChange[];
  hasChanges: boolean;
  saveStatus: SaveStatus;
  lastSaveError: string | null;
  trackChange: (change: Omit<PendingChange, "id" | "timestamp">) => void;
  clearChanges: () => void;
  getChangesSummary: () => string;
  setSaveStatus: (status: SaveStatus, error?: string | null) => void;
}

export function useChangeTracker(): UseChangeTrackerReturn {
  return useChangeTrackerContext();
}
