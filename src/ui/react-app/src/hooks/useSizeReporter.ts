/**
 * useSizeReporter — Reports content size to MCP host, capping at MAX_HEIGHT.
 *
 * NOTE: The ext-apps SDK's `useApp` hook enables autoResize by default via
 * `App.setupSizeChangedNotifications()`. This custom hook is provided as a
 * fallback if manual control is needed (e.g., to enforce height caps).
 *
 * In practice, you may not need to use this hook at all — the SDK handles it.
 */
import { useEffect, useRef, type RefObject } from "react";
import type { App } from "@modelcontextprotocol/ext-apps";

const MAX_HEIGHT = 600;

export function useSizeReporter(
  app: App | null,
  elementRef?: RefObject<HTMLElement | null>,
): RefObject<HTMLDivElement | null> {
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const ref = (elementRef as RefObject<HTMLDivElement | null>) ?? fallbackRef;

  useEffect(() => {
    if (!app) return;

    const el = ref.current ?? document.getElementById("root");
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const height = Math.min(entry.contentRect.height, MAX_HEIGHT);
        try {
          app.notification({
            method: "ui/notifications/size-changed" as any,
            params: { width: Math.ceil(width), height: Math.ceil(height) },
          });
        } catch {
          // Host may not support this notification — safe to ignore
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [app, ref]);

  return ref;
}
