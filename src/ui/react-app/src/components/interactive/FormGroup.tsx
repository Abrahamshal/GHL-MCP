/**
 * FormGroup — Dynamic form renderer with tool submission.
 * Renders labeled fields (text, number, select, textarea) based on field definitions.
 *
 * Uses useSmartAction for resilient form submission.
 */
import React, { useState, useCallback } from "react";
import { useSmartAction } from "../../hooks/useSmartAction.js";
import type { FormGroupProps } from "../../types.js";

export const FormGroup: React.FC<FormGroupProps> = ({
  fields = [],
  submitTool,
  submitLabel = "Submit",
}) => {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.key] = "";
    }
    return init;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<"success" | "queued" | null>(null);
  const { executeAction } = useSmartAction();

  const setValue = useCallback((key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setSubmitResult(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic required validation
    for (const f of fields) {
      if (f.required && !values[f.key]?.trim()) {
        return; // Don't submit if required fields empty
      }
    }

    if (!submitTool) return;

    setIsSubmitting(true);

    // Build description from form values
    const filledFields = Object.entries(values)
      .filter(([_, v]) => v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    const result = await executeAction({
      type: submitTool,
      args: values,
      description: `Submit form (${submitLabel}): ${filledFields || "empty"}`,
    });

    setIsSubmitting(false);

    if (result.success && !result.queued) {
      setSubmitResult("success");
    } else if (result.queued) {
      setSubmitResult("queued");
    }
  };

  const renderField = (field: (typeof fields)[number]) => {
    const val = values[field.key] || "";
    const type = field.type || "text";

    if (type === "select" && field.options) {
      return (
        <select
          className="mcp-field-input"
          value={val}
          onChange={(e) => setValue(field.key, e.target.value)}
        >
          <option value="" disabled>
            {field.placeholder || `Select ${field.label}...`}
          </option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === "textarea") {
      return (
        <textarea
          className="mcp-field-input fg-textarea"
          value={val}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      );
    }

    return (
      <input
        type={type}
        className="mcp-field-input"
        value={val}
        onChange={(e) => setValue(field.key, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <form className="fg-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.key} className="mcp-field">
          <label className="mcp-field-label">
            {field.label}
            {field.required && <span className="fg-required">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}
      <div className="fg-actions">
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
        {submitResult === "success" && <span style={{ color: "#059669", fontSize: 13 }}>✓ Submitted</span>}
        {submitResult === "queued" && <span style={{ color: "#d97706", fontSize: 13 }}>● Queued</span>}
      </div>
    </form>
  );
};
