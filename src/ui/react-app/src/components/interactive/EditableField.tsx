/**
 * EditableField — Click-to-edit inline field.
 * Display mode shows text; click → input; Enter/blur → save via smartAction; Escape → cancel.
 *
 * Uses useSmartAction for resilient saves with optimistic UI.
 */
import React, { useState, useRef, useEffect } from "react";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import type { EditableFieldProps } from "../../types.js";

export const EditableField: React.FC<EditableFieldProps> = ({
  value = "",
  label,
  fieldType = "text",
  saveTool,
  saveArgs,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { executeAction } = useSmartAction();

  // Sync from prop
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
      setDisplayValue(value);
    }
  }, [value, isEditing]);

  // Auto-focus on edit
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (editValue === value) return;

    // Optimistic: update display value immediately
    setDisplayValue(editValue);
    const previousValue = value;

    if (saveTool) {
      setIsSaving(true);
      const result = await executeAction({
        type: saveTool,
        args: {
          ...saveArgs,
          value: editValue,
        },
        description: `Update ${label || "field"}: "${previousValue}" → "${editValue}"`,
      });
      setIsSaving(false);

      // If failed and not queued, revert
      if (!result.success && !result.queued) {
        setDisplayValue(previousValue);
        setEditValue(previousValue);
      }
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (isEditing) {
    return (
      <div className="ef-wrap">
        {label && <label className="mcp-field-label">{label}</label>}
        <div className="ef-edit-row">
          <input
            ref={inputRef}
            type={fieldType}
            className="mcp-field-input ef-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
          />
          {isSaving && <span className="cp-spinner" />}
        </div>
      </div>
    );
  }

  return (
    <div className="ef-wrap">
      {label && <label className="mcp-field-label">{label}</label>}
      <span
        className="ef-display"
        onClick={() => setIsEditing(true)}
        title="Click to edit"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
      >
        {displayValue || <span className="ef-empty">—</span>}
        <span className="ef-edit-icon">✏️</span>
      </span>
    </div>
  );
};
