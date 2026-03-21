/**
 * Custom Fields Manager — Fields table per object type.
 * Tabs by object type: contact, opportunity, etc.
 * Columns: fieldName, fieldKey, dataType, required, placeholder.
 * Table with field metadata.
 */
import React, { useMemo, useState, useCallback } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PageHeader } from "../../components/layout/PageHeader.js";
import { Section } from "../../components/layout/Section.js";
import { DataTable } from "../../components/data/DataTable.js";
import { StatusBadge } from "../../components/data/StatusBadge.js";
import { Card } from "../../components/layout/Card.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface CustomField {
  id?: string;
  fieldName: string;
  fieldKey: string;
  dataType: string;
  required: boolean;
  placeholder?: string;
  objectType?: string;
  options?: string[];
  dateCreated?: string;
}

interface CustomFieldsData {
  fields: CustomField[];
  objectKey: string;
}

// ─── Data Extraction ────────────────────────────────────────

function extractData(result: CallToolResult): CustomFieldsData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as CustomFieldsData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as CustomFieldsData;
        } catch {
          /* skip */
        }
      }
    }
  }
  return null;
}

// ─── Object Type Tabs ───────────────────────────────────────

const OBJECT_TYPES = [
  { label: "Contact", value: "contact" },
  { label: "Opportunity", value: "opportunity" },
  { label: "Company", value: "company" },
  { label: "Order", value: "order" },
  { label: "Custom", value: "custom" },
];

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = React.useState<CustomFieldsData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldType, setNewFieldType] = useState("TEXT");

  const { app, isConnected, error } = useApp({
    appInfo: { name: "custom-fields-manager", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (createdApp) => {
      createdApp.ontoolresult = async (result) => {
        const extracted = extractData(result);
        if (extracted) {
          setData(extracted);
          if (!activeTab) setActiveTab(extracted.objectKey || "contact");
        }
      };
    },
  });

  React.useEffect(() => {
    const preInjected = (window as any).__MCP_APP_DATA__;
    if (preInjected && !data) {
      const d = preInjected as CustomFieldsData;
      setData(d);
      if (!activeTab) setActiveTab(d.objectKey || "contact");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFieldAction = useCallback(async (action: string, fieldData: Record<string, any>) => {
    if (!app) return;
    setIsActing(true);
    setActionResult(null);
    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: JSON.stringify({ action, data: fieldData }),
        }],
      });
      setActionResult({ type: 'success', msg: `✓ ${action.replace('_', ' ')} request sent` });
      setTimeout(() => setActionResult(null), 3000);
    } catch {
      setActionResult({ type: 'error', msg: '✗ Failed to send request' });
    } finally {
      setIsActing(false);
    }
  }, [app]);

  const handleCreateField = useCallback(() => {
    if (!newFieldName.trim()) return;
    handleFieldAction('create_custom_field', {
      fieldName: newFieldName.trim(),
      fieldKey: newFieldKey.trim() || newFieldName.trim().toLowerCase().replace(/\s+/g, '_'),
      dataType: newFieldType,
      objectType: activeTab,
    });
    setNewFieldName(""); setNewFieldKey(""); setNewFieldType("TEXT");
    setShowCreateForm(false);
  }, [newFieldName, newFieldKey, newFieldType, activeTab, handleFieldAction]);

  const handleDeleteField = useCallback((fieldId: string, fieldName: string) => {
    handleFieldAction('delete_custom_field', { fieldId, fieldName, objectType: activeTab });
  }, [activeTab, handleFieldAction]);

  // Group fields by object type
  const fieldsByType = useMemo(() => {
    if (!data?.fields) return {};
    const grouped: Record<string, CustomField[]> = {};
    for (const field of data.fields) {
      const objType = field.objectType ?? data.objectKey ?? "contact";
      if (!grouped[objType]) grouped[objType] = [];
      grouped[objType].push(field);
    }
    return grouped;
  }, [data?.fields, data?.objectKey]);

  // Available tabs based on actual data
  const availableTabs = useMemo(() => {
    const objectTypes = Object.keys(fieldsByType);
    if (objectTypes.length === 0) return OBJECT_TYPES;
    return OBJECT_TYPES.filter((t) => objectTypes.includes(t.value)).map((t) => ({
      ...t,
      count: fieldsByType[t.value]?.length ?? 0,
    }));
  }, [fieldsByType]);

  // Fields for the active tab
  const filteredFields = useMemo(() => {
    if (!activeTab) return data?.fields ?? [];
    return fieldsByType[activeTab] ?? data?.fields ?? [];
  }, [activeTab, fieldsByType, data?.fields]);

  // Table rows with formatted required column
  const tableRows = useMemo(
    () =>
      filteredFields.map((f, idx) => ({
        id: f.id ?? `field-${idx}`,
        fieldName: f.fieldName,
        fieldKey: f.fieldKey,
        dataType: f.dataType,
        required: f.required ? "Yes" : "No",
        placeholder: f.placeholder ?? "—",
      })),
    [filteredFields],
  );

  const tableColumns = useMemo(() => [
    { key: "fieldName", label: "Field Name", sortable: true },
    { key: "fieldKey", label: "Field Key", sortable: true },
    { key: "dataType", label: "Data Type", sortable: true },
    { key: "required", label: "Required", sortable: true },
    { key: "placeholder", label: "Placeholder" },
  ], []);

  if (error) {
    return (
      <div className="error-state">
        <h3>Connection Error</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <p>{isConnected ? "Waiting for data..." : "Connecting..."}</p>
      </div>
    );
  }

  return (
    <div id="app" style={{ padding: 4 }}>
      <PageHeader
        title="Custom Fields"
        subtitle={`Managing fields for: ${activeTab || data.objectKey}`}
        stats={[
          { label: "Total Fields", value: (data.fields?.length ?? 0).toString() },
          {
            label: "Current View",
            value: filteredFields.length.toString(),
          },
        ]}
      />

      {/* Tab Navigation */}
      <div className="tab-group" style={{ marginBottom: 8 }}>
        {availableTabs.map((t) => (
          <button
            key={t.value}
            className={`tab ${t.value === activeTab ? "tab-active" : ""}`}
            onClick={() => setActiveTab(t.value)}
          >
            {t.label}
            {"count" in t && (t as { count?: number }).count !== undefined ? (
              <span className="tab-count">{(t as { count?: number }).count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
        {/* Field Type Summary */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Array.from(new Set(filteredFields.map((f) => f.dataType))).map((type) => (
            <StatusBadge
              key={type}
              label={`${type} (${filteredFields.filter((f) => f.dataType === type).length})`}
              variant="active"
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {actionResult && (
            <span style={{ color: actionResult.type === 'success' ? '#059669' : '#dc2626', fontSize: 13, whiteSpace: 'nowrap' }}>
              {actionResult.msg}
            </span>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {showCreateForm ? 'Cancel' : '+ Add Field'}
          </button>
        </div>
      </div>

      {/* Create Custom Field Form */}
      {showCreateForm && (
        <Card title={`Create ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Field`} padding="sm">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            <div className="mcp-field">
              <label className="mcp-field-label">Field Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input
                type="text"
                className="mcp-field-input"
                placeholder="My Custom Field"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
              />
            </div>
            <div className="mcp-field">
              <label className="mcp-field-label">Field Key</label>
              <input
                type="text"
                className="mcp-field-input"
                placeholder="Auto-generated from name"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
              />
            </div>
            <div className="mcp-field">
              <label className="mcp-field-label">Data Type</label>
              <select className="mcp-field-input sd-select" value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)}>
                <option value="TEXT">Text</option>
                <option value="NUMBER">Number</option>
                <option value="DATE">Date</option>
                <option value="CHECKBOX">Checkbox</option>
                <option value="DROPDOWN">Dropdown</option>
                <option value="TEXTAREA">Textarea</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleCreateField}
              disabled={!newFieldName.trim() || isActing}
            >
              {isActing ? 'Creating…' : 'Create Field'}
            </button>
          </div>
        </Card>
      )}

      <Section title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Fields`}>
        <DataTable
          columns={tableColumns}
          rows={tableRows}
          pageSize={15}
          emptyMessage="No custom fields found for this object type"
        />
      </Section>

      {/* Quick delete actions */}
      {filteredFields.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: '28px' }}>Quick delete:</span>
          {filteredFields.slice(0, 6).map((f, idx) => (
            <button
              key={f.id ?? `field-${idx}`}
              className="chip"
              onClick={() => handleDeleteField(f.id ?? '', f.fieldName)}
              disabled={isActing}
              title={`Delete field "${f.fieldName}"`}
              style={{ color: '#dc2626' }}
            >
              🗑 {f.fieldName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
