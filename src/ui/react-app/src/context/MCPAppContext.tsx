/**
 * MCPAppContext — React Context providing shared app state and tool-calling.
 * Generic / CRM-agnostic.
 */
import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { UITree } from "../types.js";

// ─── Context Shape ──────────────────────────────────────────

export interface MCPAppContextValue {
  /** Current rendered UI tree */
  uiTree: UITree | null;
  /** Set the UI tree (called by App.tsx on ontoolresult) */
  setUITree: (tree: UITree | null) => void;
  /** Shared form state across interactive components */
  formState: Record<string, any>;
  /** Update a single form value */
  setFormValue: (key: string, value: any) => void;
  /** Reset all form values */
  resetFormState: () => void;
  /** Call an MCP server tool via the ext-apps SDK */
  callTool: (toolName: string, args: Record<string, any>) => Promise<CallToolResult>;
  /** Whether any tool call is currently in progress */
  isLoading: boolean;
  /** The ext-apps App instance (null before connection) */
  app: App | null;
}

const MCPAppContext = createContext<MCPAppContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────

export interface MCPAppProviderProps {
  app: App | null;
  children: ReactNode;
}

export function MCPAppProvider({ app, children }: MCPAppProviderProps) {
  const [uiTree, setUITree] = useState<UITree | null>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const setFormValue = useCallback((key: string, value: any) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFormState = useCallback(() => {
    setFormState({});
  }, []);

  const callTool = useCallback(
    async (toolName: string, args: Record<string, any>): Promise<CallToolResult> => {
      if (!app) {
        throw new Error("MCPApp: Not connected — cannot call tool");
      }
      setIsLoading(true);
      try {
        const result = await app.callServerTool({
          name: toolName,
          arguments: args,
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [app],
  );

  const value: MCPAppContextValue = {
    uiTree,
    setUITree,
    formState,
    setFormValue,
    resetFormState,
    callTool,
    isLoading,
    app,
  };

  return <MCPAppContext.Provider value={value}>{children}</MCPAppContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────

export function useMCPApp(): MCPAppContextValue {
  const ctx = useContext(MCPAppContext);
  if (!ctx) {
    throw new Error("useMCPApp must be used within an MCPAppProvider");
  }
  return ctx;
}
