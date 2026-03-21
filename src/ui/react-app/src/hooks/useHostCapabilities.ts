/**
 * useHostCapabilities — Detect what the MCP host supports.
 *
 * On app connect, reads host capabilities and provides booleans
 * for canCallTools, canUpdateContext, canSendMessage.
 */
import { useState, useEffect } from "react";
import { useMCPApp } from "../context/MCPAppContext.js";

export interface HostCapabilities {
  /** Host supports callServerTool (proxied tool calls) */
  canCallTools: boolean;
  /** Host supports updateModelContext */
  canUpdateContext: boolean;
  /** Host supports sendMessage */
  canSendMessage: boolean;
}

export function useHostCapabilities(): HostCapabilities {
  const { app } = useMCPApp();
  const [capabilities, setCapabilities] = useState<HostCapabilities>({
    canCallTools: false,
    canUpdateContext: false,
    canSendMessage: false,
  });

  useEffect(() => {
    if (!app) return;

    const hostCaps = app.getHostCapabilities();
    setCapabilities({
      canCallTools: !!hostCaps?.serverTools,
      // updateModelContext and sendMessage are always available per MCP spec
      canUpdateContext: true,
      canSendMessage: true,
    });
  }, [app]);

  return capabilities;
}
