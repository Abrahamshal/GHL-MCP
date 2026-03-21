# MCP App Fallback Architecture
## Graceful Degradation for Hosts Without Full Interactive Support

**Date:** 2026-02-03  
**Status:** Proposed  
**Applies to:** GoHighLevel MCP UI Kit React App

---

## Executive Summary

The ext-apps SDK provides explicit **host capability negotiation** via `McpUiHostCapabilities`. After the `ui/initialize` handshake, the View knows exactly which features the host supports. We use this to implement a **three-tier progressive enhancement** model: Static → Context-Synced → Fully Interactive.

---

## 1. Feature Detection (The Foundation)

### How It Works

When the View connects, the host returns `McpUiHostCapabilities` in the `ui/initialize` response. The `App` class exposes this via `app.getHostCapabilities()`.

**The key capability flags:**

```typescript
interface McpUiHostCapabilities {
  serverTools?: { listChanged?: boolean };    // Can proxy tools/call to MCP server
  serverResources?: { listChanged?: boolean }; // Can proxy resources/read
  updateModelContext?: {};                     // Accepts ui/update-model-context
  message?: {};                               // Accepts ui/message (send chat messages)
  openLinks?: {};                             // Can open external URLs
  logging?: {};                               // Accepts log messages
  sandbox?: { permissions?: {...}; csp?: {...} };
}
```

**The critical check: `serverTools` tells you if `callServerTool` will work.**

### Implementation: `useHostCapabilities` Hook

```typescript
// hooks/useHostCapabilities.ts

import { useMemo } from "react";
import { useMCPApp } from "../context/MCPAppContext.js";
import type { McpUiHostCapabilities } from "@modelcontextprotocol/ext-apps";

export type InteractionTier = "static" | "context-synced" | "full";

export interface HostCapabilityInfo {
  /** Raw capabilities from the host */
  raw: McpUiHostCapabilities | undefined;
  /** Whether callServerTool() will work */
  canCallTools: boolean;
  /** Whether updateModelContext() will work */
  canUpdateContext: boolean;
  /** Whether sendMessage() will work */
  canSendMessages: boolean;
  /** The interaction tier this host supports */
  tier: InteractionTier;
}

export function useHostCapabilities(): HostCapabilityInfo {
  const { app } = useMCPApp();

  return useMemo(() => {
    const raw = app?.getHostCapabilities?.() as McpUiHostCapabilities | undefined;

    const canCallTools = !!raw?.serverTools;
    const canUpdateContext = !!raw?.updateModelContext;
    const canSendMessages = !!raw?.message;

    // Determine tier
    let tier: InteractionTier = "static";
    if (canCallTools) {
      tier = "full";
    } else if (canUpdateContext) {
      tier = "context-synced";
    }

    return { raw, canCallTools, canUpdateContext, canSendMessages, tier };
  }, [app]);
}
```

### Add to MCPAppContext

```typescript
// In MCPAppContext.tsx — extend the context value:

export interface MCPAppContextValue {
  // ... existing fields ...
  
  /** Host capability info, available after connection */
  capabilities: HostCapabilityInfo;
  
  /** Safe tool call: uses callServerTool if available, 
      falls back to updateModelContext, or no-ops */
  safeCallTool: (
    toolName: string,
    args: Record<string, any>,
    options?: { localOnly?: boolean }
  ) => Promise<CallToolResult | null>;
}
```

---

## 2. The Three-Tier Model

### Tier 1: Static (No host capabilities)
- Pure data visualization — charts, tables, badges, timelines
- All data comes from the initial `ontoolresult` payload
- No server communication, no context updates
- **Components work as-is:** BarChart, PieChart, StatusBadge, DataTable, Timeline, etc.

### Tier 2: Context-Synced (`updateModelContext` available, no `serverTools`)
- Local interactivity works (drag, edit, toggle, form fills)
- User actions update LOCAL state immediately
- State changes are synced to the LLM via `updateModelContext`
- The LLM can then decide to call tools itself on the next turn
- **Key pattern:** User drags a Kanban card → local state updates → `updateModelContext` tells the LLM what happened → LLM calls `move_opportunity` on its own

### Tier 3: Full Interactive (`serverTools` available)
- Everything works as currently designed
- Components call `callServerTool` directly for real-time server mutations
- Optimistic UI with server confirmation

```
┌─────────────────────────────────────────────────┐
│                  TIER 3: FULL                    │
│  callServerTool ✓  updateModelContext ✓          │
│  Direct server mutations, optimistic UI          │
│  ┌─────────────────────────────────────────────┐ │
│  │            TIER 2: CONTEXT-SYNCED           │ │
│  │  callServerTool ✗  updateModelContext ✓     │ │
│  │  Local state + LLM-informed sync            │ │
│  │  ┌─────────────────────────────────────────┐│ │
│  │  │          TIER 1: STATIC                 ││ │
│  │  │  Read-only data visualization           ││ │
│  │  │  Charts, tables, badges, timelines      ││ │
│  │  └─────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

## 3. Component Classification

### Always Static (work everywhere)
These components are pure data display — they render from the UITree data and never call tools:

| Component | Category |
|-----------|----------|
| BarChart, LineChart, PieChart, SparklineChart, FunnelChart | charts |
| StatusBadge, ProgressBar, CurrencyDisplay, StarRating | data |
| DataTable, KeyValueList, TagList, AvatarGroup | data |
| Timeline, MetricCard, DetailHeader, InfoBlock | data |
| PageHeader, Section, Card, StatsGrid, SplitLayout | layout |
| ChatThread, TranscriptView, EmailPreview, ContentPreview | comms |
| CalendarView, TreeView, FlowDiagram, DuplicateCompare | viz |

### Context-Syncable (Tier 2+)
These work with local state and sync via `updateModelContext`:

| Component | Local Behavior | Context Sync |
|-----------|---------------|--------------|
| KanbanBoard | Drag cards between columns locally | Report new board state to LLM |
| EditableField | Edit text inline locally | Report edited values to LLM |
| FormGroup | Fill form fields locally | Report form state to LLM |
| SelectDropdown | Select options locally | Report selection to LLM |
| AmountInput | Adjust amounts locally | Report new amounts to LLM |
| ChecklistView | Toggle checkboxes locally | Report checklist state to LLM |
| FilterChips | Toggle filters locally | Report active filters to LLM |
| TabGroup | Switch tabs locally | Report active tab to LLM |
| SearchBar | Type search queries locally | Report search to LLM |

### Full Interactive Only (Tier 3)
These **require** server tool calls and degrade gracefully at lower tiers:

| Component | Tier 3 | Tier 2 Fallback | Tier 1 Fallback |
|-----------|--------|-----------------|-----------------|
| ActionButton | Calls tool | Shows "Ask assistant" hint | Disabled/hidden |
| AppointmentBooker | Books via tool | Shows form, reports to LLM | Shows read-only schedule |
| InvoiceBuilder | Creates via tool | Builds locally, reports to LLM | Shows existing invoice data |
| OpportunityEditor | Saves via tool | Edits locally, reports to LLM | Shows read-only data |
| ContactPicker | Searches via tool | Shows static options list | Shows read-only display |

---

## 4. Concrete Implementation

### 4a. `safeCallTool` — The Universal Action Handler

```typescript
// In MCPAppProvider

const safeCallTool = useCallback(
  async (
    toolName: string,
    args: Record<string, any>,
    options?: { localOnly?: boolean }
  ): Promise<CallToolResult | null> => {
    // Tier 3: Full tool call
    if (capabilities.canCallTools && !options?.localOnly) {
      return callTool(toolName, args);
    }

    // Tier 2: Inform LLM via updateModelContext
    if (capabilities.canUpdateContext && app) {
      const markdown = [
        `---`,
        `action: ${toolName}`,
        `timestamp: ${new Date().toISOString()}`,
        ...Object.entries(args).map(([k, v]) => `${k}: ${JSON.stringify(v)}`),
        `---`,
        `User performed action "${toolName}" in the UI.`,
        `Please execute the corresponding server-side operation.`,
      ].join("\n");

      await app.updateModelContext({
        content: [{ type: "text", text: markdown }],
      });

      // Return a synthetic "pending" result
      return {
        content: [
          {
            type: "text",
            text: `Action "${toolName}" reported to assistant. It will be processed on the next turn.`,
          },
        ],
      } as CallToolResult;
    }

    // Tier 1: No-op, return null
    console.warn(`[MCPApp] Cannot execute ${toolName}: no host support`);
    return null;
  },
  [capabilities, callTool, app]
);
```

### 4b. `<InteractiveGate>` — Tier-Aware Wrapper

```tsx
// components/shared/InteractiveGate.tsx

import React from "react";
import { useHostCapabilities, type InteractionTier } from "../../hooks/useHostCapabilities.js";

interface InteractiveGateProps {
  /** Minimum tier required to show children */
  requires: InteractionTier;
  /** What to render if the tier isn't met */
  fallback?: React.ReactNode;
  /** If true, hide entirely instead of showing fallback */
  hideOnUnsupported?: boolean;
  children: React.ReactNode;
}

const tierLevel: Record<InteractionTier, number> = {
  static: 0,
  "context-synced": 1,
  full: 2,
};

export const InteractiveGate: React.FC<InteractiveGateProps> = ({
  requires,
  fallback,
  hideOnUnsupported = false,
  children,
}) => {
  const { tier } = useHostCapabilities();

  if (tierLevel[tier] >= tierLevel[requires]) {
    return <>{children}</>;
  }

  if (hideOnUnsupported) return null;

  if (fallback) return <>{fallback}</>;

  // Default fallback: subtle message
  return (
    <div className="interactive-unavailable" role="note">
      <span className="interactive-unavailable-icon">ℹ️</span>
      <span>This feature requires a supported host. Ask the assistant to perform this action.</span>
    </div>
  );
};
```

### 4c. Refactored `ActionButton` with Fallback

```tsx
// components/shared/ActionButton.tsx (revised)

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  variant = "secondary",
  size = "md",
  disabled,
  toolName,
  toolArgs,
}) => {
  const { safeCallTool } = useMCPApp();
  const { tier, canCallTools, canSendMessages } = useHostCapabilities();
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (!toolName || loading || disabled) return;

    setLoading(true);
    setPendingMessage(null);
    try {
      const result = await safeCallTool(toolName, toolArgs || {});
      
      // Tier 2: show "reported to assistant" feedback
      if (!canCallTools && result) {
        setPendingMessage("Reported to assistant");
        setTimeout(() => setPendingMessage(null), 3000);
      }
    } catch {
      // handled by context
    } finally {
      setLoading(false);
    }
  }, [toolName, toolArgs, loading, disabled, safeCallTool, canCallTools]);

  // Tier 1 with no context sync: show disabled with hint
  if (tier === "static" && toolName) {
    return (
      <button className={`btn ${vCls} ${sCls} btn-unsupported`} disabled title="Ask the assistant to perform this action">
        {label}
      </button>
    );
  }

  return (
    <button className={`btn ${vCls} ${sCls}`} disabled={disabled || loading} onClick={handleClick}>
      {loading && <span className="loading-spinner" style={{ width: 14, height: 14, marginRight: 6, borderWidth: 2, display: "inline-block" }} />}
      {label}
      {pendingMessage && <span className="btn-pending-badge">{pendingMessage}</span>}
    </button>
  );
};
```

### 4d. Refactored `KanbanBoard` — Local-First + Context Sync

The KanbanBoard already uses optimistic local state. The only change: fall back to `updateModelContext` when `moveTool` can't be called directly.

```tsx
// In KanbanBoard onDrop handler (revised):

const onDrop = useCallback(async (e: React.DragEvent, toStageId: string) => {
  e.preventDefault();
  setDropTargetStage(null);

  const drag = dragRef.current;
  if (!drag) return;
  const { cardId, fromStageId } = drag;
  dragRef.current = null;
  setDraggingCardId(null);
  if (fromStageId === toStageId) return;

  // 1. Optimistic local update (same as before)
  let movedCard: KanbanCard | undefined;
  const prevColumns = columns;
  setColumns(prev => { /* ... same optimistic logic ... */ });

  // 2. Use safeCallTool — works at Tier 2 AND Tier 3
  if (moveTool) {
    try {
      const result = await safeCallTool(moveTool, {
        opportunityId: cardId,
        pipelineStageId: toStageId,
      });
      
      // Tier 2: result is a "reported" message — no revert needed
      // Local state IS the source of truth until LLM processes it
      if (!capabilities.canCallTools && result) {
        // Also report the full board state so LLM has context
        await reportBoardState();
      }
    } catch (err) {
      // Only revert if we attempted a real tool call (Tier 3)
      if (capabilities.canCallTools) {
        console.error("KanbanBoard: move failed, reverting", err);
        setColumns(prevColumns);
      }
    }
  }
}, [columns, moveTool, safeCallTool, capabilities]);

// Report full board state to LLM for context
const reportBoardState = useCallback(async () => {
  if (!app || !capabilities.canUpdateContext) return;
  
  const summary = columns.map(col => 
    `**${col.title}** (${col.cards?.length ?? 0}):\n` +
    (col.cards || []).map(c => `  - ${c.title} (${c.value || 'no value'})`).join('\n')
  ).join('\n\n');

  await app.updateModelContext({
    content: [{
      type: "text",
      text: `---\ncomponent: kanban-board\nupdated: ${new Date().toISOString()}\n---\nCurrent pipeline state:\n\n${summary}`,
    }],
  });
}, [app, capabilities, columns]);
```

### 4e. Refactored `EditableField` — Works at All Tiers

```tsx
// In EditableField (revised handleSave):

const handleSave = async () => {
  setIsEditing(false);
  if (editValue === value) return;

  if (saveTool) {
    const result = await safeCallTool(saveTool, {
      ...saveArgs,
      value: editValue,
    });

    // Tier 2: field stays locally updated; LLM is informed
    // Tier 3: server confirms; UI may refresh via ontoolresult
    // Tier 1: nothing happens — but user sees their edit locally
    
    if (!result && tier === "static") {
      // Show hint that the change is display-only
      setLocalOnlyHint(true);
      setTimeout(() => setLocalOnlyHint(false), 3000);
    }
  }
};
```

---

## 5. Alternative Interaction: `updateModelContext` as Primary Channel

For hosts that support `updateModelContext` but not `serverTools`, we can use a **declarative intent** pattern instead of imperative tool calls:

```typescript
// hooks/useReportInteraction.ts

export function useReportInteraction() {
  const { app } = useMCPApp();
  const { canUpdateContext } = useHostCapabilities();

  return useCallback(
    async (interaction: {
      component: string;
      action: string;
      data: Record<string, any>;
      suggestion?: string; // What we suggest the LLM should do
    }) => {
      if (!canUpdateContext || !app) return;

      const text = [
        `---`,
        `component: ${interaction.component}`,
        `action: ${interaction.action}`,
        `timestamp: ${new Date().toISOString()}`,
        ...Object.entries(interaction.data).map(([k, v]) => `${k}: ${JSON.stringify(v)}`),
        `---`,
        interaction.suggestion || `User performed "${interaction.action}" in ${interaction.component}.`,
      ].join("\n");

      await app.updateModelContext({
        content: [{ type: "text", text }],
      });
    },
    [app, canUpdateContext]
  );
}
```

**Usage in any component:**

```tsx
const reportInteraction = useReportInteraction();

// In a form submit handler:
await reportInteraction({
  component: "AppointmentBooker",
  action: "book_appointment",
  data: { contactId, calendarId, startTime, endTime },
  suggestion: "User wants to book this appointment. Please call create_appointment with these details.",
});
```

---

## 6. Server-Side: Dual-Mode Tool Registration

The MCP server should register tools that work both ways:

```typescript
// Server-side: Register tool as visible to both model and app
registerAppTool(server, "move_opportunity", {
  description: "Move an opportunity to a different pipeline stage",
  inputSchema: {
    opportunityId: z.string(),
    pipelineStageId: z.string(),
  },
  _meta: {
    ui: {
      resourceUri: "ui://ghl/pipeline-view",
      visibility: ["model", "app"],  // ← Both can call it
    },
  },
}, handler);
```

With `visibility: ["model", "app"]`:
- **Tier 3 hosts:** App calls it directly via `callServerTool`
- **Tier 2 hosts:** App reports intent via `updateModelContext`, LLM sees the tool in its tool list and calls it on the next turn
- **Tier 1 hosts:** Tool still works as text-only through normal MCP

---

## 7. `window.__MCP_APP_DATA__` Pre-Injection (Tier 0)

The existing `getPreInjectedTree()` in App.tsx already supports a non-MCP path. For environments where the iframe loads but the ext-apps SDK never connects:

```typescript
// App.tsx already handles this:
useEffect(() => {
  const preInjected = getPreInjectedTree();
  if (preInjected && !uiTree) {
    setUITree(preInjected);
  }
}, []);
```

This serves as **Tier 0**: pure server-side rendering. The server injects the UITree directly into the HTML. No SDK connection needed. All components render in static mode.

---

## 8. CSS for Degraded States

```css
/* styles/fallback.css */

/* Unsupported interactive elements */
.btn-unsupported {
  opacity: 0.6;
  cursor: not-allowed;
  position: relative;
}
.btn-unsupported::after {
  content: "↗";
  font-size: 0.7em;
  margin-left: 4px;
  opacity: 0.5;
}

/* "Reported to assistant" badge */
.btn-pending-badge {
  margin-left: 8px;
  font-size: 0.75em;
  color: var(--color-text-info, #3b82f6);
  animation: fadeIn 0.2s ease-in;
}

/* Unavailable feature hint */
.interactive-unavailable {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius-md, 6px);
  background: var(--color-background-info, #eff6ff);
  color: var(--color-text-secondary, #6b7280);
  font-size: 0.85em;
}

/* Local-only edit hint */
.ef-local-hint {
  font-size: 0.75em;
  color: var(--color-text-warning, #f59e0b);
  margin-top: 2px;
}

/* Editable fields in static mode: remove edit affordance */
[data-tier="static"] .ef-edit-icon {
  display: none;
}
[data-tier="static"] .ef-display {
  cursor: default;
}
```

---

## 9. Decision Matrix

| Scenario | Detection | Behavior |
|----------|-----------|----------|
| Claude Desktop (full support) | `serverTools` ✓ | Tier 3: all features work |
| Host with context-only support | `updateModelContext` ✓, `serverTools` ✗ | Tier 2: local + LLM sync |
| Minimal host / basic iframe | No capabilities | Tier 1: static display |
| Pre-injected `__MCP_APP_DATA__` | No SDK connection | Tier 0: SSR static |
| `callServerTool` fails at runtime | Error caught | Downgrade to Tier 2 dynamically |

---

## 10. Summary: What to Implement

### Phase 1 (Essential)
1. **`useHostCapabilities` hook** — reads `app.getHostCapabilities()`, computes tier
2. **`safeCallTool` in MCPAppContext** — wraps callTool with fallback to updateModelContext
3. **Update `ActionButton`** — use safeCallTool, show disabled state at Tier 1
4. **Update `KanbanBoard`** — already local-first, just wire up safeCallTool + reportBoardState
5. **`fallback.css`** — styles for degraded states

### Phase 2 (Full Coverage)
6. **`useReportInteraction` hook** — standard way to inform LLM of UI actions
7. **`<InteractiveGate>` component** — declarative tier gating in templates
8. **Update all interactive components** — EditableField, FormGroup, AppointmentBooker, etc.
9. **Runtime downgrade** — if a Tier 3 call fails, auto-downgrade to Tier 2

### Phase 3 (Polish)
10. **Toast notifications** for tier-specific feedback ("Action sent to assistant")
11. **`data-tier` attribute** on root for CSS-only degradation
12. **Testing matrix** — automated tests per tier per component

---

## Key Insight

The ext-apps spec was **designed** for this: *"UI is a progressive enhancement, not a requirement."* Our architecture mirrors this philosophy — every component starts as a static data display and progressively gains interactivity based on what the host reports it can do. The KanbanBoard's existing optimistic-update pattern is already the correct Tier 2 pattern; we just need to formalize it and apply it consistently.
