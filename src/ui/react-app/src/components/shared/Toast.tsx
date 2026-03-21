/**
 * Toast — Context + Hook pattern for stackable toast notifications.
 * Renders via React portal. Auto-dismiss after 2.5s.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ──────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

// ─── Single Toast ───────────────────────────────────────────

const ToastNotification: React.FC<{
  item: ToastItem;
  index: number;
  onDismiss: (id: number) => void;
}> = ({ item, index, onDismiss }) => {
  useEffect(() => {
    // Animate in
    const showTimer = requestAnimationFrame(() => {
      // Force reflow then show — handled via className
    });

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      onDismiss(item.id);
    }, 2500);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [item.id, onDismiss]);

  const typeClass =
    item.type === "success"
      ? "mcp-toast-success"
      : item.type === "error"
        ? "mcp-toast-error"
        : "mcp-toast-info";

  return (
    <div
      className={`mcp-toast ${typeClass} ${item.visible ? "mcp-toast-show" : ""}`}
      style={{ bottom: `${12 + index * 44}px` }}
      role="alert"
    >
      {item.message}
    </div>
  );
};

// ─── Provider ───────────────────────────────────────────────

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    // Fade out
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t)),
    );
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type, visible: false }]);
      // Trigger visible on next tick for CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, visible: true } : t)),
          );
        });
      });
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            {toasts.map((item, i) => (
              <ToastNotification
                key={item.id}
                item={item}
                index={i}
                onDismiss={dismiss}
              />
            ))}
          </>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
