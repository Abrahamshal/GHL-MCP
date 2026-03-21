# Agent Task Briefs (for Phase 2 spawn)

## Shared Context for ALL Phase 2 Agents
- Working dir: `/Users/jakeshore/.clawdbot/workspace/mcp-diagrams/GoHighLevel-MCP/src/ui/react-app/`
- Read the full plan: `../../REACT-REWRITE-PLAN.md`
- Read types: `src/types.ts` (created by Alpha — has all prop interfaces)
- Read registry: `src/renderer/registry.ts` (has stub components — replace yours)
- Read current string implementations: `../json-render-app/src/components.ts` and `../json-render-app/src/charts.ts`
- Use MCPAppContext via `import { useMCPApp } from '../context/MCPAppContext'` for callTool
- CSS goes in `src/styles/components.css` (display) or `src/styles/interactive.css` (interactive)
- Each component is a React FC exported from its own file
- After building all components, UPDATE `src/renderer/registry.ts` to import your real components instead of stubs
- NO GHL references — everything is generic MCP UI Kit
- Compact sizing: 12px base, tight padding, designed for chat inline display

---

## Agent Bravo — Layout + Core Data (15 components)

### Files to create:
```
src/components/layout/PageHeader.tsx
src/components/layout/Card.tsx
src/components/layout/StatsGrid.tsx
src/components/layout/SplitLayout.tsx
src/components/layout/Section.tsx
src/components/data/DataTable.tsx
src/components/data/KanbanBoard.tsx      ← DRAG AND DROP (key component)
src/components/data/MetricCard.tsx
src/components/data/StatusBadge.tsx
src/components/data/Timeline.tsx
src/components/data/DetailHeader.tsx
src/components/data/KeyValueList.tsx
src/components/data/LineItemsTable.tsx
src/components/data/InfoBlock.tsx
src/components/data/ProgressBar.tsx
```

### Special attention:
- **KanbanBoard** — Must have REAL drag-and-drop via React state (onDragStart/onDragOver/onDrop).
  - Cards are draggable between columns
  - Optimistic UI: move card immediately in state, revert on error
  - Accepts `moveTool?: string` prop — if provided, calls `callTool(moveTool, { opportunityId, pipelineStageId })` on drop
  - Drop zone highlights with dashed border
  - Cards show hover lift effect
- **DataTable** — Sortable columns (click header), clickable rows (emit onRowClick), pagination
- All layout components accept `children` prop for nested UITree elements

---

## Agent Charlie — Extended Data + Navigation + Actions (15 components)

### Files to create:
```
src/components/data/CurrencyDisplay.tsx
src/components/data/TagList.tsx
src/components/data/CardGrid.tsx
src/components/data/AvatarGroup.tsx
src/components/data/StarRating.tsx
src/components/data/StockIndicator.tsx
src/components/shared/SearchBar.tsx
src/components/shared/FilterChips.tsx
src/components/shared/TabGroup.tsx
src/components/shared/ActionButton.tsx
src/components/shared/ActionBar.tsx
```

Plus from data/:
```
src/components/data/ChecklistView.tsx
src/components/data/AudioPlayer.tsx
```

### Special attention:
- **SearchBar** — Controlled input, fires onChange with debounce. Accepts `onSearch?: (query: string) => void`
- **FilterChips** — Toggle active state on click, fires onFilter
- **TabGroup** — Controlled tab state, fires onTabChange
- **ActionButton** — Accepts `onClick` + optional `toolName` + `toolArgs` props. If toolName provided, calls callTool on click.
- **ChecklistView** — Checkboxes toggle completed state. Accepts `onToggle?: (itemId, completed) => void`

---

## Agent Delta — Comms + Viz + Charts (16 components)

### Files to create:
```
src/components/comms/ChatThread.tsx
src/components/comms/EmailPreview.tsx
src/components/comms/ContentPreview.tsx
src/components/comms/TranscriptView.tsx
src/components/viz/CalendarView.tsx
src/components/viz/FlowDiagram.tsx
src/components/viz/TreeView.tsx
src/components/viz/MediaGallery.tsx
src/components/viz/DuplicateCompare.tsx
src/components/charts/BarChart.tsx
src/components/charts/LineChart.tsx
src/components/charts/PieChart.tsx
src/components/charts/FunnelChart.tsx
src/components/charts/SparklineChart.tsx
```

### Special attention:
- **All charts** — Use inline SVG (same approach as current charts.ts). Convert from template strings to JSX SVG elements.
- **CalendarView** — Grid layout, today highlight, event dots. Accepts `onDateClick?: (date: string) => void`
- **TreeView** — Expandable nodes with click-to-toggle. Track expanded state in local component state.
- **ChatThread** — Outbound messages right-aligned indigo, inbound left-aligned gray. Auto-scroll to bottom.
- **FlowDiagram** — Horizontal/vertical node→arrow→node layout with SVG connectors.

---

## Agent Echo — Interactive Components + Forms (8 components + shared UI)

### Files to create:
```
src/components/interactive/ContactPicker.tsx
src/components/interactive/InvoiceBuilder.tsx
src/components/interactive/OpportunityEditor.tsx
src/components/interactive/AppointmentBooker.tsx
src/components/interactive/EditableField.tsx
src/components/interactive/SelectDropdown.tsx
src/components/interactive/FormGroup.tsx
src/components/interactive/AmountInput.tsx
src/components/shared/Toast.tsx
src/components/shared/Modal.tsx
```

### Critical design:
ALL interactive components are **CRM-agnostic**. They receive tool names as props.

- **ContactPicker** — Searchable dropdown.
  - Props: `searchTool: string` (e.g., "search_contacts"), `onSelect: (contact) => void`, `placeholder?: string`
  - On keystroke (debounced 300ms): calls `callTool(searchTool, { query })` → displays results as dropdown options
  - On select: calls onSelect with full contact object, closes dropdown
  - Shows loading spinner during search

- **InvoiceBuilder** — Multi-section form.
  - Props: `createTool?: string`, `contactSearchTool?: string`
  - Sections: Contact (uses ContactPicker), Line Items (add/remove rows), Totals (auto-calc)
  - Each line item: description, quantity, unit price, total
  - "Create Invoice" button calls `callTool(createTool, { contactId, lineItems, ... })`

- **OpportunityEditor** — Inline edit form.
  - Props: `saveTool: string` (e.g., "update_opportunity"), `opportunity: { id, name, value, status, stageId }`
  - Renders current values with click-to-edit behavior
  - Save button calls `callTool(saveTool, { opportunityId, ...changes })`

- **AppointmentBooker** — Date/time picker + form.
  - Props: `calendarTool?: string`, `bookTool?: string`, `contactSearchTool?: string`
  - Calendar grid for date selection, time slot list, contact picker, notes field
  - Book button calls `callTool(bookTool, { calendarId, contactId, date, time, ... })`

- **EditableField** — Click-to-edit wrapper.
  - Props: `value: string`, `saveTool?: string`, `saveArgs?: Record`, `fieldName: string`
  - Click → shows input, blur/enter → saves via callTool if provided

- **SelectDropdown** — Generic async select.
  - Props: `loadTool?: string`, `options?: Array`, `onChange`, `placeholder`
  - If loadTool provided, fetches options on mount/open

- **FormGroup** — Layout for labeled form fields.
  - Props: `fields: Array<{ key, label, type, value, required? }>`, `onSubmit`, `submitLabel`

- **AmountInput** — Currency-formatted number input.
  - Props: `value, onChange, currency?, locale?`
  - Formats display as $1,234.56, stores raw number

- **Toast** — Notification component (renders via React portal).
  - Export `useToast()` hook: `const { showToast } = useToast()`
  - `showToast('Deal moved!', 'success')` — auto-dismisses

- **Modal** — Dialog component (renders via React portal).
  - Props: `isOpen, onClose, title, children, footer?`
  - Backdrop click to close, escape key to close

### Styles:
Write `src/styles/interactive.css` with all interactive styles (modals, toasts, dropdowns, drag states, form inputs, etc.)
