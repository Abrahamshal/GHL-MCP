/**
 * Modal — Portal-based modal with backdrop blur, ESC to close, click-outside to close.
 */
import React, { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  // ESC key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modal = (
    <div className="mcp-modal-overlay" onClick={handleOverlayClick}>
      <div className="mcp-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mcp-modal-header">
          <span className="mcp-modal-title">{title}</span>
          <button
            className="mcp-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="mcp-modal-body">{children}</div>
        {footer && <div className="mcp-modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : null;
};
