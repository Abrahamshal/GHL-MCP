/**
 * useCallTool — Hook wrapping callTool from context with per-call state.
 *
 * Usage:
 *   const { execute, isLoading, error, result } = useCallTool();
 *   await execute('update_opportunity', { id: '123', status: 'won' });
 */
import { useState, useCallback } from "react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { useMCPApp } from "../context/MCPAppContext.js";

export interface UseCallToolReturn {
  /** Execute a tool call */
  execute: (toolName: string, args: Record<string, any>) => Promise<CallToolResult | null>;
  /** Whether this specific call is in progress */
  isLoading: boolean;
  /** Error from the last call, if any */
  error: Error | null;
  /** Result from the last successful call */
  result: CallToolResult | null;
  /** Clear error and result state */
  reset: () => void;
}

export function useCallTool(): UseCallToolReturn {
  const { callTool } = useMCPApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<CallToolResult | null>(null);

  const execute = useCallback(
    async (toolName: string, args: Record<string, any>): Promise<CallToolResult | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await callTool(toolName, args);
        setResult(res);
        return res;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [callTool],
  );

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
  }, []);

  return { execute, isLoading, error, result, reset };
}
