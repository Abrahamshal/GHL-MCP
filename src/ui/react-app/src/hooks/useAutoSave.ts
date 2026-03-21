/**
 * useAutoSave — Debounced auto-save that fires sendMessage when in fallback mode.
 *
 * When the host doesn't support direct tool calls (canCallTools=false),
 * changes accumulate locally. After `debounceMs` of inactivity, this hook
 * sends a message to the host chat asking the model to persist the changes.
 */
import { useEffect, useRef } from "react";
import { useChangeTracker } from "./useChangeTracker.js";
import { useHostCapabilities } from "./useHostCapabilities.js";
import { useMCPApp } from "../context/MCPAppContext.js";

export function useAutoSave(debounceMs = 3000) {
  const { changes, hasChanges, clearChanges, getChangesSummary, setSaveStatus } =
    useChangeTracker();
  const { canCallTools } = useHostCapabilities();
  const { app } = useMCPApp();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only auto-save when in fallback mode (no direct tool calls)
    if (canCallTools || !hasChanges || !app) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      const summary = getChangesSummary();
      setSaveStatus("saving");

      try {
        await app.sendMessage({
          role: "user",
          content: [
            {
              type: "text",
              text: `Please save these changes:\n${summary}`,
            },
          ],
        });
        clearChanges();
        setSaveStatus("saved");

        // Reset to idle after 3 seconds
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setSaveStatus("error", errorMsg);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [changes, canCallTools, hasChanges, app, debounceMs, getChangesSummary, clearChanges, setSaveStatus]);
}
