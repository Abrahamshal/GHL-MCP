/**
 * UITree Type Definitions for GHL MCP Apps
 * Shared types for the universal renderer and template system.
 */

// ─── Core UITree Types ──────────────────────────────────────

export interface UIElement {
  key: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: string[];
}

export interface UITree {
  root: string;
  elements: Record<string, UIElement>;
}

// ─── Component Type Union ───────────────────────────────────

export type ComponentType =
  // Layout
  | 'PageHeader'
  | 'Card'
  | 'StatsGrid'
  | 'SplitLayout'
  | 'Section'
  // Data Display
  | 'DataTable'
  | 'KanbanBoard'
  | 'MetricCard'
  | 'StatusBadge'
  | 'Timeline'
  | 'ProgressBar'
  // Detail View
  | 'DetailHeader'
  | 'KeyValueList'
  | 'LineItemsTable'
  | 'InfoBlock'
  // Interactive
  | 'SearchBar'
  | 'FilterChips'
  | 'TabGroup'
  | 'ActionButton'
  | 'ActionBar'
  // Extended Data Display
  | 'CurrencyDisplay'
  | 'TagList'
  | 'CardGrid'
  | 'AvatarGroup'
  | 'StarRating'
  | 'StockIndicator'
  // Communication
  | 'ChatThread'
  | 'EmailPreview'
  | 'ContentPreview'
  | 'TranscriptView'
  | 'AudioPlayer'
  | 'ChecklistView'
  // Visualization
  | 'CalendarView'
  | 'FlowDiagram'
  | 'TreeView'
  | 'MediaGallery'
  | 'DuplicateCompare'
  // Charts
  | 'BarChart'
  | 'LineChart'
  | 'PieChart'
  | 'FunnelChart'
  | 'SparklineChart'
  // Interactive Editors
  | 'ContactPicker'
  | 'InvoiceBuilder'
  | 'OpportunityEditor'
  | 'AppointmentBooker'
  | 'EditableField'
  | 'SelectDropdown'
  | 'FormGroup'
  | 'AmountInput';

// ─── All valid component names for validation ───────────────

export const VALID_COMPONENT_TYPES: ReadonlySet<string> = new Set<ComponentType>([
  'PageHeader', 'Card', 'StatsGrid', 'SplitLayout', 'Section',
  'DataTable', 'KanbanBoard', 'MetricCard', 'StatusBadge', 'Timeline', 'ProgressBar',
  'DetailHeader', 'KeyValueList', 'LineItemsTable', 'InfoBlock',
  'SearchBar', 'FilterChips', 'TabGroup', 'ActionButton', 'ActionBar',
  'CurrencyDisplay', 'TagList', 'CardGrid', 'AvatarGroup', 'StarRating', 'StockIndicator',
  'ChatThread', 'EmailPreview', 'ContentPreview', 'TranscriptView', 'AudioPlayer', 'ChecklistView',
  'CalendarView', 'FlowDiagram', 'TreeView', 'MediaGallery', 'DuplicateCompare',
  'BarChart', 'LineChart', 'PieChart', 'FunnelChart', 'SparklineChart',
  'ContactPicker', 'InvoiceBuilder', 'OpportunityEditor', 'AppointmentBooker',
  'EditableField', 'SelectDropdown', 'FormGroup', 'AmountInput',
]);

// ─── Components that can contain children ───────────────────

export const CONTAINER_COMPONENTS: ReadonlySet<string> = new Set<ComponentType>([
  'PageHeader', 'Card', 'StatsGrid', 'SplitLayout', 'Section',
  'DetailHeader', 'ActionBar',
]);

// ─── Required props per component (minimal set) ─────────────

export const REQUIRED_PROPS: Readonly<Record<string, readonly string[]>> = {
  PageHeader: ['title'],
  DataTable: ['columns', 'rows'],
  KanbanBoard: ['columns'],
  MetricCard: ['label', 'value'],
  StatusBadge: ['label', 'variant'],
  Timeline: ['events'],
  ProgressBar: ['label', 'value'],
  DetailHeader: ['title'],
  KeyValueList: ['items'],
  LineItemsTable: ['items'],
  InfoBlock: ['label', 'name', 'lines'],
  CalendarView: [],
  FlowDiagram: ['nodes', 'edges'],
  BarChart: ['bars'],
  LineChart: ['points'],
  PieChart: ['segments'],
  FunnelChart: ['stages'],
  SparklineChart: ['values'],
  CurrencyDisplay: ['amount'],
  TagList: ['tags'],
  CardGrid: ['cards'],
  AvatarGroup: ['avatars'],
  StarRating: ['rating'],
  StockIndicator: ['quantity'],
  ChatThread: ['messages'],
  EmailPreview: ['from', 'to', 'subject', 'date', 'body'],
  ChecklistView: ['items'],
  FormGroup: ['fields'],
  AmountInput: ['value'],
  EditableField: ['value', 'fieldName'],
  OpportunityEditor: ['saveTool', 'opportunity'],
  ContactPicker: ['searchTool'],
};

// ─── Prop Interfaces for Template-Used Components ───────────

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: 'active' | 'complete' | 'paused' | 'draft' | 'error' | 'sent' | 'paid' | 'pending';
  gradient?: boolean;
  stats?: Array<{ label: string; value: string }>;
}

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: string;
  format?: 'text' | 'email' | 'phone' | 'date' | 'currency' | 'tags' | 'avatar' | 'status';
  width?: string;
}

export interface DataTableProps {
  columns: DataTableColumn[];
  rows: Record<string, any>[];
  selectable?: boolean;
  rowAction?: string;
  emptyMessage?: string;
  pageSize?: number;
}

export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
  status?: string;
  statusVariant?: string;
  date?: string;
  avatarInitials?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  count?: number;
  totalValue?: string;
  color?: string;
  cards: KanbanCard[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export interface MetricCardProps {
  label: string;
  value: string;
  format?: 'number' | 'currency' | 'percent';
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  color?: 'default' | 'green' | 'blue' | 'purple' | 'yellow' | 'red';
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: 'email' | 'phone' | 'note' | 'meeting' | 'task' | 'system';
  variant?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
}

export interface KeyValueItem {
  label: string;
  value: string;
  bold?: boolean;
  variant?: 'default' | 'highlight' | 'muted' | 'success' | 'danger';
  isTotalRow?: boolean;
}

export interface KeyValueListProps {
  items: KeyValueItem[];
  compact?: boolean;
}

export interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface LineItemsTableProps {
  items: LineItem[];
  currency?: string;
}

export interface InfoBlockProps {
  label: string;
  name: string;
  lines: string[];
}

export interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  entityId?: string;
  status?: string;
  statusVariant?: string;
}

export interface SearchBarProps {
  placeholder?: string;
  valuePath?: string;
}

export interface CalendarEvent {
  date: string;
  title: string;
  time?: string;
  color?: string;
  type?: 'meeting' | 'call' | 'task' | 'deadline' | 'event';
}

export interface CalendarViewProps {
  year?: number;
  month?: number;
  events: CalendarEvent[];
  highlightToday?: boolean;
  title?: string;
}

export interface FlowNode {
  id: string;
  label: string;
  type?: 'start' | 'action' | 'condition' | 'end';
  description?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction?: 'horizontal' | 'vertical';
  title?: string;
}

export interface BarChartBar {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  bars: BarChartBar[];
  orientation?: 'vertical' | 'horizontal';
  maxValue?: number;
  showValues?: boolean;
  title?: string;
}

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  points: LineChartPoint[];
  color?: string;
  showPoints?: boolean;
  showArea?: boolean;
  title?: string;
  yAxisLabel?: string;
}

// ─── UITree Validation ──────────────────────────────────────

export interface ValidationError {
  path: string;
  message: string;
}

/**
 * Validate a UITree for correctness:
 * - Root key exists in elements
 * - All children references resolve
 * - All component types are valid
 * - Required props are present
 */
export function validateUITree(tree: UITree): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!tree || typeof tree !== 'object') {
    errors.push({ path: '', message: 'UITree must be a non-null object' });
    return errors;
  }

  if (!tree.root) {
    errors.push({ path: 'root', message: 'Missing root key' });
  }

  if (!tree.elements || typeof tree.elements !== 'object') {
    errors.push({ path: 'elements', message: 'Missing or invalid elements map' });
    return errors;
  }

  // Check root exists in elements
  if (tree.root && !tree.elements[tree.root]) {
    errors.push({ path: 'root', message: `Root key "${tree.root}" not found in elements` });
  }

  // Validate each element
  for (const [key, element] of Object.entries(tree.elements)) {
    const ePath = `elements.${key}`;

    // Check key matches
    if (element.key !== key) {
      errors.push({ path: ePath, message: `Element key mismatch: "${element.key}" vs map key "${key}"` });
    }

    // Check component type
    if (!VALID_COMPONENT_TYPES.has(element.type)) {
      errors.push({ path: `${ePath}.type`, message: `Unknown component type: "${element.type}"` });
    }

    // Check required props
    const requiredProps = REQUIRED_PROPS[element.type];
    if (requiredProps) {
      for (const prop of requiredProps) {
        if (element.props[prop] === undefined || element.props[prop] === null) {
          errors.push({ path: `${ePath}.props.${prop}`, message: `Missing required prop "${prop}" for ${element.type}` });
        }
      }
    }

    // Check children references
    if (element.children) {
      for (const childKey of element.children) {
        if (!tree.elements[childKey]) {
          errors.push({ path: `${ePath}.children`, message: `Child reference "${childKey}" not found in elements` });
        }
      }
    }
  }

  return errors;
}
