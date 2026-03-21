/**
 * OpportunityEditor — Inline-editable opportunity fields with stage/status dropdowns.
 * CRM-agnostic: saveTool received as prop.
 *
 * Uses useSmartAction for resilient saves with optimistic UI.
 */
import React, { useState, useCallback } from "react";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import type { OpportunityEditorProps } from "../../types.js";

const STATUS_OPTIONS = ["open", "won", "lost", "abandoned"];

export const OpportunityEditor: React.FC<OpportunityEditorProps> = ({
  fields = {},
  stages = [],
  saveTool,
}) => {
  const [editFields, setEditFields] = useState<Record<string, any>>({ ...fields });
  const [dirty, setDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "queued" | null>(null);
  const { executeAction } = useSmartAction();

  const updateField = useCallback((key: string, value: any) => {
    setEditFields((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveResult(null);
  }, []);

  const handleSave = async () => {
    if (!saveTool || !dirty) return;

    const changes: Record<string, any> = {};
    for (const [key, val] of Object.entries(editFields)) {
      if (val !== fields[key]) {
        changes[key] = val;
      }
    }

    if (Object.keys(changes).length === 0) return;

    setIsSaving(true);
    const changeDescriptions = Object.entries(changes)
      .map(([k, v]) => `${k}: ${fields[k] ?? "—"} → ${v}`)
      .join(", ");

    const result = await executeAction({
      type: saveTool,
      args: {
        opportunityId: editFields.id,
        ...changes,
      },
      description: `Update opportunity ${editFields.name || editFields.id || ""}: ${changeDescriptions}`,
    });

    setIsSaving(false);

    if (result.success && !result.queued) {
      // Direct save succeeded
      setDirty(false);
      setSaveResult("success");
    } else if (result.queued) {
      // Queued for auto-save
      setDirty(false);
      setSaveResult("queued");
    }
    // If failed and not queued, keep dirty state so user can retry
  };

  return (
    <div className="oe-wrap">
      {/* Name */}
      <div className="mcp-field">
        <label className="mcp-field-label">Name</label>
        <input
          type="text"
          className="mcp-field-input"
          value={editFields.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </div>

      {/* Monetary Value */}
      <div className="mcp-field">
        <label className="mcp-field-label">Value</label>
        <input
          type="number"
          className="mcp-field-input"
          value={editFields.monetaryValue ?? ""}
          onChange={(e) =>
            updateField("monetaryValue", parseFloat(e.target.value) || 0)
          }
          step="0.01"
        />
      </div>

      {/* Status */}
      <div className="mcp-field">
        <label className="mcp-field-label">Status</label>
        <select
          className="mcp-field-input sd-select"
          value={editFields.status || "open"}
          onChange={(e) => updateField("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Pipeline Stage */}
      {stages.length > 0 && (
        <div className="mcp-field">
          <label className="mcp-field-label">Stage</label>
          <select
            className="mcp-field-input sd-select"
            value={editFields.pipelineStageId || ""}
            onChange={(e) => updateField("pipelineStageId", e.target.value)}
          >
            <option value="" disabled>
              Select stage...
            </option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Save */}
      {saveTool && (
        <div className="oe-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={!dirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          {dirty && <span className="oe-dirty">Unsaved changes</span>}
          {saveResult === "success" && <span style={{ color: "#059669", fontSize: 13 }}>✓ Saved</span>}
          {saveResult === "queued" && <span style={{ color: "#d97706", fontSize: 13 }}>● Queued</span>}
        </div>
      )}
    </div>
  );
};
