/**
 * useSmartAction — Hybrid action executor.
 *
 * Detects host capabilities and uses the best path:
 * - If canCallTools: call server tool directly, fallback to tracking on failure
 * - If !canCallTools: track change locally, notify model via updateModelContext
 *
 * Components use this instead of direct callTool for resilient interactivity.
 */
import { useCallback } from "react";
import { useHostCapabilities } from "./useHostCapabilities.js";
import { useChangeTracker, type PendingChange } from "./useChangeTracker.js";
import { useMCPApp } from "../context/MCPAppContext.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface ActionInput {
  type: string;
  args: Record<string, any>;
  description: string;
}

export interface ActionResult {
  success: boolean;
  result?: CallToolResult;
  queued?: boolean;
  error?: Error;
}

export function useSmartAction() {
  const { canCallTools } = useHostCapabilities();
  const { trackChange } = useChangeTracker();
  const { callTool, app } = useMCPApp();

  const executeAction = useCallback(
    async (action: ActionInput): Promise<ActionResult> => {
      if (canCallTools) {
        // Direct path: call server tool immediately
        try {
          const result = await callTool(action.type, action.args);
          return { success: true, result };
        } catch (err) {
          // Fallback: track locally if direct call fails
          trackChange({
            type: action.type,
            args: action.args,
            description: action.description,
          });

          // Silently notify model about the queued change
          if (app) {
            try {
              await app.updateModelContext({
                content: [
                  {
                    type: "text",
                    text: `User action queued (tool call failed): ${action.description}`,
                  },
                ],
              });
            } catch {
              // Ignore context update failures
            }
          }

          return {
            success: false,
            queued: true,
            error: err instanceof Error ? err : new Error(String(err)),
          };
        }
      } else {
        // Fallback path: track locally + notify model
        trackChange({
          type: action.type,
          args: action.args,
          description: action.description,
        });

        // Silently update model context
        if (app) {
          try {
            await app.updateModelContext({
              content: [
                {
                  type: "text",
                  text: `User action: ${action.description}`,
                },
              ],
            });
          } catch {
            // Ignore context update failures
          }
        }

        return { success: true, queued: true };
      }
    },
    [canCallTools, callTool, trackChange, app],
  );

  return { executeAction, canCallTools };
}
