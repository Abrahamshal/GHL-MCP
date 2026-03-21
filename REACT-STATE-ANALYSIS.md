# React State & Hydration Analysis — MCP App Lifecycle

## Executive Summary

**The interactive state destruction is caused by a cascading chain of three interconnected bugs:**
1. Every tool call result replaces the entire UITree → full component tree teardown
2. Element keys from the server may not be stable across calls → React unmounts everything
3. All interactive components store state locally (`useState`) instead of in the shared context that was built specifically to survive re-renders

---

## Bug #1: `ontoolresult` → `setUITree()` Nuclear Replacement

### The Code (App.tsx:80-86)
```tsx
app.ontoolresult = async (result) => {
  const tree = extractUITree(result);
  if (tree) {
    setUITree(tree);   // ← REPLACES the entire tree object
    setToolInput(null);
  }
};
```

### What Happens
Every tool result that contains a UITree — even from a button click, search query, or tab switch — causes `setUITree(brandNewTreeObject)`. This triggers:

1. `App.tsx` re-renders with new `uiTree` state
2. `<UITreeRenderer tree={uiTree} />` receives a **new object reference**
3. `ElementRenderer` receives a **new `elements` map** (new reference, even if data is identical)
4. React walks the entire tree and reconciles

**The critical question:** does it unmount/remount or just re-render?

That depends entirely on **Bug #2** (keys).

---

## Bug #2: `key: element.key` — Keys Control Component Identity

### The Code (UITreeRenderer.tsx:37-40)
```tsx
// Each component gets its key from the JSON tree
return React.createElement(Component, { key: element.key, ...element.props }, childElements);

// Children also keyed from the tree
const childElements = element.children?.map((childKey) =>
  React.createElement(ElementRenderer, {
    key: childKey,         // ← from JSON
    elementKey: childKey,  // ← from JSON
    elements,
  }),
);
```

### The Problem
React uses `key` to determine component identity. When keys change between renders:
- **Same key** → React re-renders the existing component (state preserved)
- **Different key** → React unmounts old, mounts new (STATE DESTROYED)

If the MCP server generates keys like `contact-list-abc123` on call #1 and `contact-list-def456` on call #2, React sees them as **completely different components** and tears down the entire subtree.

**Even if keys are stable**, the `elements` object reference changes every time, forcing re-renders down the entire tree. Not a state-loss issue by itself, but causes performance problems and can trigger effects/callbacks unnecessarily.

---

## Bug #3: Dual `uiTree` State — App.tsx vs MCPAppContext

### The Code
```tsx
// App.tsx — has its own uiTree state
const [uiTree, setUITree] = useState<UITree | null>(null);

// MCPAppContext.tsx — ALSO has its own uiTree state
const [uiTree, setUITree] = useState<UITree | null>(null);
```

### The Problem
There are **two completely independent `uiTree` states**:
- `App.tsx` manages the actual rendering tree (used by `<UITreeRenderer tree={uiTree} />`)
- `MCPAppContext` has its own `uiTree` + `setUITree` exposed via context, but **nobody calls the context's `setUITree`**

The context's `uiTree` is **always null**. The context was designed to provide shared state (`formState`, `setFormValue`, `callTool`), but the tree management is disconnected.

---

## Bug #4: Interactive Components Use Local State That Gets Destroyed

### FormGroup (forms reset)
```tsx
// FormGroup.tsx — all form values in LOCAL useState
const [values, setValues] = useState<Record<string, string>>(() => {
  const init: Record<string, string> = {};
  for (const f of fields) { init[f.key] = ""; }
  return init;
});
```

**Chain:** User types → submits → `execute(submitTool, values)` → server returns new tree → `ontoolresult` → `setUITree(newTree)` → FormGroup unmounts → remounts → `values` resets to `{}`

### KanbanBoard (drag-and-drop fails)
```tsx
// KanbanBoard.tsx — drag state + columns in LOCAL state
const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
const [dropTargetStage, setDropTargetStage] = useState<string | null>(null);
const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
const dragRef = useRef<DragState | null>(null);
```

**Chain:** User drags card → optimistic update → `callTool(moveTool, ...)` → server returns new tree → `ontoolresult` → `setUITree(newTree)` → KanbanBoard unmounts → remounts → drag state gone, optimistic move reverted, columns reset to server data

The KanbanBoard even has a mitigation attempt that fails:
```tsx
// This ref-based sync ONLY works if React re-renders without unmounting
const prevColumnsRef = useRef(initialColumns);
if (prevColumnsRef.current !== initialColumns) {
  prevColumnsRef.current = initialColumns;
  setColumns(initialColumns);  // ← This runs, but after unmount/remount it's moot
}
```

### SearchBar (search clears)
```tsx
// SearchBar.tsx — query in LOCAL state
const [value, setValue] = useState("");
```

**Chain:** User types query → debounced `callTool(searchTool, ...)` → server returns new tree → SearchBar unmounts → remounts → search input clears

### ActionButton (stops working)
```tsx
// ActionButton.tsx — loading state in LOCAL state
const [loading, setLoading] = useState(false);
```

**Chain:** User clicks → `setLoading(true)` → `callTool(...)` → server returns new tree → ActionButton unmounts → remounts → `loading` stuck at initial `false`, but the async `callTool` still has a stale closure reference. The `finally { setLoading(false) }` calls `setLoading` on an unmounted component.

### TabGroup (tab selection lost)
```tsx
const [localActive, setLocalActive] = useState<string>(
  controlledActiveTab || tabs[0]?.value || "",
);
```

**Chain:** User clicks tab → `setLocalActive(value)` → `callTool(switchTool, ...)` → new tree → TabGroup remounts → `localActive` resets to first tab

### ContactPicker (search results disappear)
```tsx
const [query, setQuery] = useState("");
const [results, setResults] = useState<Contact[]>([]);
const [isOpen, setIsOpen] = useState(false);
const [selected, setSelected] = useState<Contact | null>(null);
```

### InvoiceBuilder (entire form wiped)
```tsx
const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(...);
const [taxRate, setTaxRate] = useState(8.5);
```

---

## Bug #5: Hydration Path Mismatch

### The Code (App.tsx:60-66)
```tsx
useEffect(() => {
  const preInjected = getPreInjectedTree();
  if (preInjected && !uiTree) {
    setUITree(preInjected);
  }
}, []);
```

### The Problem
Not a React hydration mismatch (we use `createRoot`, not `hydrateRoot`), but a **data transition issue**:

1. App mounts → `uiTree = null` → shows "Connecting..."
2. `useEffect` fires → finds `window.__MCP_APP_DATA__` → `setUITree(preInjectedTree)`
3. Tree renders with pre-injected keys
4. `ontoolresult` fires with server-generated tree → `setUITree(serverTree)`
5. If keys differ between pre-injected and server tree → **full unmount/remount**

The pre-injected path and the dynamic path produce trees with potentially different key schemas, causing a jarring full teardown on the first real tool result.

---

## Bug #6: MCPAppProvider Context Is Stable (NOT a bug)

`MCPAppProvider` wrapping does **not** cause context loss. It's rendered consistently in all branches of the conditional render in App.tsx. The provider identity is stable.

However, the provider creates a **new `value` object on every render**:
```tsx
const value: MCPAppContextValue = {
  uiTree, setUITree, formState, setFormValue, resetFormState, callTool, isLoading, app,
};
return <MCPAppContext.Provider value={value}>{children}</MCPAppContext.Provider>;
```

This causes every `useMCPApp()` consumer to re-render on every provider render, but it doesn't cause state loss — just unnecessary renders.

---

## The Kill Chain (Full Interaction Flow)

```
User clicks ActionButton("View Contact", toolName="get_contact", toolArgs={id: "123"})
  │
  ├─ ActionButton.handleClick()
  │   ├─ setLoading(true)
  │   └─ callTool("get_contact", {id: "123"})
  │       └─ app.callServerTool({name: "get_contact", arguments: {id: "123"}})
  │
  ├─ MCP Server processes tool call, returns CallToolResult with NEW UITree
  │
  ├─ app.ontoolresult fires
  │   ├─ extractUITree(result) → newTree (new keys, new elements, new object)
  │   └─ setUITree(newTree)  ← App.tsx state update
  │
  ├─ App.tsx re-renders
  │   └─ <UITreeRenderer tree={newTree} />
  │       └─ ElementRenderer receives new elements map
  │           └─ For each element: React.createElement(Component, {key: NEW_KEY, ...})
  │               └─ React sees different key → UNMOUNT old component, MOUNT new one
  │
  ├─ ALL components unmount:
  │   ├─ FormGroup: values={} (reset)
  │   ├─ KanbanBoard: columns=initial, dragState=null (reset)
  │   ├─ SearchBar: value="" (reset)
  │   ├─ TabGroup: localActive=first tab (reset)
  │   ├─ ContactPicker: query="", results=[], selected=null (reset)
  │   └─ InvoiceBuilder: lineItems=[default], contact=null (reset)
  │
  └─ Meanwhile, ActionButton's finally{} block calls setLoading(false)
     on an UNMOUNTED component → React warning + no-op
```

---

## Fixes

### Fix 1: Deterministic Stable Keys (Server-Side)
The MCP server must generate **deterministic, position-stable keys** for UITree elements. Keys should be based on component type + semantic identity, not random IDs.

```typescript
// BAD: keys change every call
{ key: `card-${crypto.randomUUID()}`, type: "Card", ... }

// GOOD: keys are stable across calls
{ key: "contact-detail-card", type: "Card", ... }
{ key: "pipeline-kanban", type: "KanbanBoard", ... }
```

### Fix 2: Tree Diffing / Partial Updates Instead of Full Replace
Don't replace the entire tree on every tool result. Diff the new tree against the old one and only update changed branches:

```tsx
// App.tsx — instead of wholesale replace:
app.ontoolresult = async (result) => {
  const newTree = extractUITree(result);
  if (newTree) {
    setUITree(prev => {
      if (!prev) return newTree;
      // Merge: keep unchanged elements, update changed ones
      return mergeUITrees(prev, newTree);
    });
  }
};

function mergeUITrees(oldTree: UITree, newTree: UITree): UITree {
  const mergedElements: Record<string, UIElement> = {};
  for (const [key, newEl] of Object.entries(newTree.elements)) {
    const oldEl = oldTree.elements[key];
    // Keep old reference if data is identical (prevents re-render)
    if (oldEl && JSON.stringify(oldEl) === JSON.stringify(newEl)) {
      mergedElements[key] = oldEl;
    } else {
      mergedElements[key] = newEl;
    }
  }
  return { root: newTree.root, elements: mergedElements };
}
```

### Fix 3: Separate Data Results from UI Results
Not every tool call should trigger a tree replacement. ActionButton clicks that return data (not a new view) should be handled by the component, not by `ontoolresult`:

```tsx
// ActionButton.tsx — handle result locally, don't let ontoolresult replace tree
const handleClick = useCallback(async () => {
  if (!toolName || loading || disabled) return;
  setLoading(true);
  try {
    const result = await callTool(toolName, toolArgs || {});
    // Result handled locally — only navigate if result contains a NEW view
    if (result && hasNavigationIntent(result)) {
      // Let ontoolresult handle it
    }
    // Otherwise, toast/notification with result, don't replace tree
  } finally {
    setLoading(false);
  }
}, [toolName, toolArgs, loading, disabled, callTool]);
```

### Fix 4: Move Interactive State to Context
Use the existing `formState` in MCPAppContext instead of local `useState`:

```tsx
// FormGroup.tsx — use shared form state that survives remounts
const { formState, setFormValue } = useMCPApp();

// Instead of local useState, derive from context
const getValue = (key: string) => formState[`form:${formId}:${key}`] ?? "";
const setValue = (key: string, val: string) => setFormValue(`form:${formId}:${key}`, val);
```

### Fix 5: Fix the Dual uiTree State
Either:
- **Option A:** Remove `uiTree` from MCPAppContext entirely (it's unused)
- **Option B:** Have App.tsx use the context's uiTree and remove its local state

```tsx
// Option B: App.tsx uses context state
export function App() {
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();
  // Remove local uiTree state — let context own it
  
  // In MCPAppProvider, connect ontoolresult to context's setUITree
}
```

### Fix 6: Memoize Context Value
Prevent unnecessary re-renders of all context consumers:

```tsx
// MCPAppContext.tsx
const value = useMemo<MCPAppContextValue>(() => ({
  uiTree, setUITree, formState, setFormValue, resetFormState, callTool, isLoading, app,
}), [uiTree, formState, callTool, isLoading, app]);
```

### Fix 7: Add React.memo to Leaf Components
Prevent re-renders when props haven't actually changed:

```tsx
export const MetricCard = React.memo<MetricCardProps>(({ label, value, trend, ... }) => {
  // ...
});

export const StatusBadge = React.memo<StatusBadgeProps>(({ label, variant }) => {
  // ...
});
```

---

## Priority Order

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | Stable keys (server-side) | 🔴 Critical — fixes unmount/remount | Medium |
| 2 | Tree diffing/merge | 🔴 Critical — prevents unnecessary teardown | Medium |
| 3 | Separate data vs UI results | 🟡 High — stops button clicks from nuking the view | Low |
| 4 | Context-based interactive state | 🟡 High — state survives even if components remount | Medium |
| 5 | Fix dual uiTree state | 🟢 Medium — removes confusion, single source of truth | Low |
| 6 | Memoize context value | 🟢 Medium — performance improvement | Low |
| 7 | React.memo leaf components | 🟢 Low — performance polish | Low |
