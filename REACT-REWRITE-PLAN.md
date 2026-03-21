# MCP UI Kit — React Rewrite Plan

## Vision
Build a **generic, reusable MCP UI component library** using React + ext-apps SDK. Any MCP server (GHL, HubSpot, Salesforce, etc.) can use this component kit to render AI-generated interactive UIs. GHL is the first implementation. The library is CRM-agnostic — interactive components accept tool names as props so each server configures its own tool mappings.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Goose / Claude Desktop (MCP Host)                       │
│                                                          │
│   tools/call → GHL MCP Server → GHL API                │
│        ↑           ↓                                     │
│   tools/call   structuredContent (JSON UI tree)         │
│        ↑           ↓                                     │
│   ┌─────────────────────────────────────────────┐       │
│   │  React App (iframe via ext-apps SDK)         │       │
│   │                                              │       │
│   │  useApp() hook ← ontoolresult (UI tree)     │       │
│   │       ↓                                      │       │
│   │  MCPAppProvider (React Context)              │       │
│   │    - uiTree state                            │       │
│   │    - formState (inputs, selections)          │       │
│   │    - callTool(name, args) → MCP server      │       │
│   │       ↓                                      │       │
│   │  <UITreeRenderer tree={uiTree} />            │       │
│   │    - Looks up component by type              │       │
│   │    - Renders React component with props      │       │
│   │    - Recursively renders children            │       │
│   │       ↓                                      │       │
│   │  42 Display Components (pure, CRM-agnostic)  │       │
│   │  + 8 Interactive Components (tool-configurable)│     │
│   │    - ContactPicker(searchTool="search_contacts")│    │
│   │    - InvoiceBuilder(createTool="create_invoice")│    │
│   │    - KanbanBoard(onMoveTool="update_opportunity")│   │
│   │    - EditableField(saveTool=props.saveTool)  │       │
│   └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## File Structure (New)

```
src/ui/react-app/                  # GENERIC MCP UI KIT (no GHL references)
├── package.json                   # React + ext-apps SDK deps
├── vite.config.ts                 # Vite + singlefile + React
├── tsconfig.json
├── index.html                     # Entry point
├── src/
│   ├── App.tsx                    # Root — useApp hook, MCPAppProvider
│   ├── types.ts                   # UITree, UIElement, component prop interfaces
│   ├── context/
│   │   └── MCPAppContext.tsx      # React Context — uiTree, formState, callTool
│   ├── hooks/
│   │   ├── useCallTool.ts        # Hook wrapping app.callServerTool
│   │   ├── useFormState.ts       # Shared form state management
│   │   └── useSizeReporter.ts    # Auto-report content size to host
│   ├── renderer/
│   │   ├── UITreeRenderer.tsx    # Recursive tree → React component resolver
│   │   └── registry.ts           # Component name → React component map
│   ├── components/
│   │   ├── layout/               # PageHeader, Card, SplitLayout, Section, StatsGrid
│   │   ├── data/                 # DataTable, KanbanBoard, MetricCard, StatusBadge,
│   │   │                         # Timeline, ProgressBar, KeyValueList, etc.
│   │   ├── charts/               # BarChart, LineChart, PieChart, FunnelChart, Sparkline
│   │   ├── comms/                # ChatThread, EmailPreview, TranscriptView, etc.
│   │   ├── viz/                  # CalendarView, FlowDiagram, TreeView, MediaGallery, etc.
│   │   ├── interactive/          # ContactPicker, InvoiceBuilder, EditableField, etc.
│   │   │                         # All accept tool names as PROPS (CRM-agnostic)
│   │   └── shared/               # ActionButton, Toast, Modal (React portals)
│   └── styles/
│       ├── base.css              # Reset, variables, typography
│       ├── components.css        # Component-specific styles (compact for chat)
│       └── interactive.css       # Drag/drop, modals, toasts, form styles
```

### CRM-Agnostic Design Principle
- NO component imports GHL types or references GHL tool names
- Interactive components receive tool names via props:
  - `ContactPicker` → `searchTool="search_contacts"` (GHL) or `"hubspot_search_contacts"` (HubSpot)
  - `KanbanBoard` → `moveTool="update_opportunity"` (GHL) or `"move_deal"` (Pipedrive)
  - `InvoiceBuilder` → `createTool="create_invoice"` (any billing system)
- The MCP server's AI prompt tells Claude which tool names to use in the UI tree
- Components call `callTool(props.toolName, args)` — they don't know or care what CRM is behind it

## Component Inventory

### Existing 42 (string → React conversion)

**Layout (5):** PageHeader, Card, StatsGrid, SplitLayout, Section
**Data Display (10):** DataTable, KanbanBoard, MetricCard, StatusBadge, Timeline, ProgressBar, DetailHeader, KeyValueList, LineItemsTable, InfoBlock
**Navigation (3):** SearchBar, FilterChips, TabGroup
**Actions (2):** ActionButton, ActionBar
**Extended Data (6):** CurrencyDisplay, TagList, CardGrid, AvatarGroup, StarRating, StockIndicator
**Communications (6):** ChatThread, EmailPreview, ContentPreview, TranscriptView, AudioPlayer, ChecklistView
**Visualization (5):** CalendarView, FlowDiagram, TreeView, MediaGallery, DuplicateCompare
**Charts (5):** BarChart, LineChart, PieChart, FunnelChart, SparklineChart

### New Interactive Components (8)

| Component | Purpose | MCP Tools Used |
|-----------|---------|----------------|
| **ContactPicker** | Searchable dropdown, fetches contacts on type | `search_contacts` |
| **InvoiceBuilder** | Line items, totals, contact auto-fill | `create_invoice`, `get_contact` |
| **OpportunityEditor** | Inline edit deal name/value/status/stage | `update_opportunity` |
| **AppointmentBooker** | Calendar slot picker + booking form | `get_calendar`, `create_appointment` |
| **EditableField** | Click-to-edit any text/number field | varies (generic) |
| **SelectDropdown** | Generic select with async option loading | varies |
| **FormGroup** | Group of form fields with validation | varies |
| **AmountInput** | Currency-formatted number input | — (local state) |

---

## Agent Team Plan

### Phase 1: Foundation (Sequential — 1 agent)

**Agent Alpha — Project Scaffold + App Shell**
- Create `src/ui/react-app/` with package.json, vite.config, tsconfig
- Install deps: react, react-dom, @modelcontextprotocol/ext-apps, @vitejs/plugin-react, vite-plugin-singlefile
- Build `App.tsx` with `useApp` hook — handles ontoolresult, ontoolinput, host context
- Build `GHLContext.tsx` — React context providing uiTree, formState, callTool
- Build `useCallTool.ts` — wrapper around `app.callServerTool` with loading/error states
- Build `useFormState.ts` — shared form state hook
- Build `useSizeReporter.ts` — auto-measures content, sends `ui/notifications/size-changed`
- Build `UITreeRenderer.tsx` — recursive renderer that resolves component types from registry
- Build `registry.ts` — component map (stubs for now, filled by other agents)
- Build `types.ts` — UITree, UIElement, all component prop interfaces
- Build base CSS (`base.css`) — reset, variables, compact typography
- Update outer build pipeline in GoHighLevel-MCP `package.json` to build React app
- **Output:** Working scaffold that renders a loading state, connects to host via ext-apps

### Phase 2: Components (Parallel — 4 agents)

**Agent Bravo — Layout + Core Data Components (15)**
Files: `components/layout/`, `components/data/` (first half)
- PageHeader, Card, StatsGrid, SplitLayout, Section
- DataTable (with clickable rows, sortable columns)
- KanbanBoard (with FULL drag-and-drop via React state — no DOM hacking)
- MetricCard, StatusBadge, Timeline
- Register all in registry.ts
- Component CSS in `components.css`

**Agent Charlie — Data Display + Navigation + Actions (15)**
Files: `components/data/` (second half), `components/shared/`
- ProgressBar, DetailHeader, KeyValueList, LineItemsTable, InfoBlock
- SearchBar, FilterChips, TabGroup
- ActionButton, ActionBar
- CurrencyDisplay, TagList, CardGrid, AvatarGroup, StarRating, StockIndicator
- Register all in registry.ts

**Agent Delta — Comms + Viz + Charts (16)**
Files: `components/comms/`, `components/viz/`, `components/charts/`
- ChatThread, EmailPreview, ContentPreview, TranscriptView, AudioPlayer, ChecklistView
- CalendarView, FlowDiagram, TreeView, MediaGallery, DuplicateCompare
- BarChart, LineChart, PieChart, FunnelChart, SparklineChart
- All chart components use inline SVG (same approach, just JSX)
- Register all in registry.ts

**Agent Echo — Interactive Components + Forms (8)**
Files: `components/interactive/`, `hooks/`
- ContactPicker — searchable dropdown, calls `search_contacts` on keystroke with debounce
- InvoiceBuilder — line items table + contact selection + auto-total
- OpportunityEditor — inline edit form for deal fields, saves via `update_opportunity`
- AppointmentBooker — date/time picker + contact + calendar selection
- EditableField — click-to-edit wrapper for any field
- SelectDropdown — generic async select
- FormGroup — form layout with labels + validation
- AmountInput — formatted currency input
- Shared: Toast component, Modal component (proper React portals)
- Integrate with GHLContext for tool calling

### Phase 3: Integration (Sequential — 1 agent)

**Agent Foxtrot — Wire Everything Together**
- Merge all component registrations into `registry.ts`
- Update `src/apps/index.ts`:
  - Add new tool definitions for interactive components (`create_invoice`, `create_appointment`)
  - Update resource handler for `ui://ghl/dynamic-view` to serve React build
  - Add new resource URIs if needed
- Update `src/server.ts` if new tools need routing
- Update system prompt: add new interactive component catalog entries
- Update Goose config `available_tools` if needed
- Full build: React app → singlefile HTML → server TypeScript
- Test: verify JSON UI trees render correctly, interactive components call tools, drag-and-drop works
- Write brief README for the new architecture

---

## Key Technical Decisions

### State Management
- **React Context** (not Redux) — app is small enough, context + useReducer is perfect
- `GHLContext` holds: current UITree, form values, loading states, selected entities
- Any component can `const { callTool } = useGHL()` to interact with the MCP server

### Tool Calling Pattern
```tsx
// Any component can call MCP tools:
const { callTool, isLoading } = useCallTool();

const handleDrop = async (cardId: string, newStageId: string) => {
  await callTool('update_opportunity', {
    opportunityId: cardId,
    pipelineStageId: newStageId,
  });
};
```

### Drag & Drop (KanbanBoard)
- Pure React state — no global DOM event handlers
- `onDragStart`, `onDragOver`, `onDrop` on React elements
- Optimistic UI update (move card immediately, revert on error)

### Dynamic Sizing
- `useSizeReporter` hook — ResizeObserver on `#app`
- Sends `ui/notifications/size-changed` on every size change
- Caps at 600px height

### CSS Strategy
- Plain CSS files (not CSS modules, not Tailwind) — keeps bundle simple
- Same compact sizing as current (12px base, tight padding)
- All in `styles/` directory, imported in App.tsx
- Interactive styles (drag states, modals, toasts) in separate file

### Build Pipeline
```bash
# In src/ui/react-app/
npm run build
# → Vite builds React app → vite-plugin-singlefile → single HTML file
# → Output: ../../dist/app-ui/dynamic-view.html

# In GoHighLevel-MCP root
npm run build
# → Builds React UI first, then compiles TypeScript server
```

---

## Timeline Estimate

| Phase | Agents | Est. Time | Depends On |
|-------|--------|-----------|------------|
| Phase 1: Foundation | Alpha (1) | ~20 min | — |
| Phase 2: Components | Bravo, Charlie, Delta, Echo (4 parallel) | ~25 min | Phase 1 |
| Phase 3: Integration | Foxtrot (1) | ~15 min | Phase 2 |
| **Total** | **6 agents** | **~60 min** | |

---

## Success Criteria
1. ✅ All 42 existing components render identically to current version
2. ✅ JSON UI trees from Claude work without any format changes
3. ✅ KanbanBoard drag-and-drop moves deals and persists via `update_opportunity`
4. ✅ ContactPicker fetches real contacts from GHL on keystroke
5. ✅ InvoiceBuilder creates invoices with real contact data
6. ✅ EditableField saves changes via appropriate MCP tool
7. ✅ Dynamic sizing works — views fit in chat
8. ✅ Single HTML file output (vite-plugin-singlefile)
9. ✅ ext-apps handshake completes with Goose
10. ✅ All existing `view_*` tools still work alongside `generate_ghl_view`
