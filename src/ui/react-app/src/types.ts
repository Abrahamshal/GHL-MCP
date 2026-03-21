/**
 * MCP UI Kit — Type definitions for the UI tree and all component props.
 * Generic / CRM-agnostic. No GHL references.
 */

// ─── UI Tree Structure ──────────────────────────────────────

export interface UIElement {
  key: string;
  type: string;
  props: Record<string, any>;
  children?: string[];
}

export interface UITree {
  root: string;
  elements: Record<string, UIElement>;
}

// ─── Shared / Utility Types ─────────────────────────────────

export type StatusVariant =
  | "active"
  | "complete"
  | "paused"
  | "draft"
  | "error"
  | "sent"
  | "paid"
  | "pending"
  | "open"
  | "won"
  | "lost"
  | "abandoned";

export type TrendDirection = "up" | "down" | "flat";

export type MetricColor =
  | "default"
  | "green"
  | "blue"
  | "purple"
  | "yellow"
  | "red";

export type BarColor = "green" | "blue" | "purple" | "yellow" | "red";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export type Padding = "none" | "sm" | "md" | "lg";

export type SplitRatio = "50/50" | "33/67" | "67/33";

export type GapSize = "sm" | "md" | "lg";

export type Alignment = "left" | "center" | "right";

export type CurrencySize = "sm" | "md" | "lg";

export type TagColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "gray"
  | "indigo"
  | "pink";

export type TagVariant = "filled" | "outlined";

export type AvatarSize = "sm" | "md" | "lg";

export type ChatMessageDirection = "inbound" | "outbound";

export type ChatMessageType = "sms" | "email" | "call" | "whatsapp";

export type ContentFormat = "html" | "markdown" | "text";

export type SpeakerRole = "agent" | "customer" | "system";

export type AudioType = "recording" | "voicemail";

export type Priority = "low" | "medium" | "high";

export type FlowDirection = "horizontal" | "vertical";

export type FlowNodeType = "start" | "action" | "condition" | "end";

export type ChartOrientation = "horizontal" | "vertical";

// ─── Stat / Sub-item Types ──────────────────────────────────

export interface StatItem {
  label: string;
  value: string;
}

export interface TableColumn {
  key: string;
  label: string;
  format?: string;
  sortable?: boolean;
  width?: string;
}

export interface TableRow {
  id?: string;
  [key: string]: any;
}

export interface KanbanColumn {
  id: string;
  title: string;
  count?: number;
  totalValue?: string;
  cards?: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  title: string;
  subtitle?: string;
  avatarInitials?: string;
  value?: string;
  date?: string;
  status?: string;
  statusVariant?: string;
}

export interface TimelineEvent {
  title: string;
  description?: string;
  timestamp: string;
  variant?: "default" | "success" | "warning" | "error";
  icon?: string;
}

export interface KeyValueItem {
  label: string;
  value: string;
  isTotalRow?: boolean;
  bold?: boolean;
  variant?: "success" | "highlight" | "muted" | "danger";
}

export interface LineItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FilterChip {
  label: string;
  active?: boolean;
  value?: string;
}

export interface TabItem {
  label: string;
  value: string;
  count?: number;
}

export interface TagItem {
  label: string;
  color?: TagColor;
  variant?: TagVariant;
}

export interface CardGridItem {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  status?: string;
  statusVariant?: string;
  action?: string;
}

export interface AvatarItem {
  name: string;
  initials?: string;
  imageUrl?: string;
}

export interface StarDistribution {
  stars: number;
  count: number;
}

export interface ChatMessage {
  content: string;
  direction: ChatMessageDirection;
  senderName?: string;
  avatar?: string;
  timestamp?: string;
  type?: ChatMessageType;
}

export interface EmailAttachment {
  name: string;
  size?: string;
}

export interface TranscriptEntry {
  speaker: string;
  speakerRole?: SpeakerRole;
  text: string;
  timestamp: string;
}

export interface ChecklistItem {
  title: string;
  completed?: boolean;
  dueDate?: string;
  assignee?: string;
  priority?: Priority;
}

export interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  type?: string;
  color?: string;
}

export interface FlowNode {
  id: string;
  label: string;
  description?: string;
  type?: FlowNodeType;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
}

export interface TreeNode {
  label: string;
  icon?: string;
  badge?: string;
  expanded?: boolean;
  children?: TreeNode[];
}

export interface MediaItem {
  title?: string;
  url?: string;
  thumbnailUrl?: string;
  fileType?: string;
  fileSize?: string;
  date?: string;
}

export interface CompareRecord {
  label?: string;
  fields: Record<string, string>;
}

export interface BarChartBar {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartPoint {
  label: string;
  value: number;
}

export interface PieSegment {
  label: string;
  value: number;
  color?: string;
}

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

// ─── Layout Component Props ─────────────────────────────────

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: StatusVariant;
  gradient?: boolean;
  stats?: StatItem[];
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  padding?: Padding;
  noBorder?: boolean;
}

export interface StatsGridProps {
  columns?: number;
}

export interface SplitLayoutProps {
  ratio?: SplitRatio;
  gap?: GapSize;
}

export interface SectionProps {
  title?: string;
  description?: string;
}

// ─── Data Display Component Props ───────────────────────────

export interface DataTableProps {
  columns?: TableColumn[];
  rows?: TableRow[];
  selectable?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  /** Tool to call when a row is clicked */
  rowClickTool?: string;
}

export interface KanbanBoardProps {
  columns?: KanbanColumn[];
  /** Tool to call when a card is moved between columns */
  moveTool?: string;
  /** Tool to call when a card is clicked */
  cardClickTool?: string;
}

export interface MetricCardProps {
  label: string;
  value: string;
  trend?: TrendDirection;
  trendValue?: string;
  color?: MetricColor;
}

export interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
}

export interface TimelineProps {
  events?: TimelineEvent[];
}

export interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  color?: BarColor;
  showPercent?: boolean;
  benchmark?: number;
  benchmarkLabel?: string;
}

export interface DetailHeaderProps {
  title: string;
  subtitle?: string;
  entityId?: string;
  status?: string;
  statusVariant?: StatusVariant;
}

export interface KeyValueListProps {
  items?: KeyValueItem[];
  compact?: boolean;
}

export interface LineItemsTableProps {
  items?: LineItem[];
  currency?: string;
}

export interface InfoBlockProps {
  label: string;
  name: string;
  lines?: string[];
}

// ─── Navigation Component Props ─────────────────────────────

export interface SearchBarProps {
  placeholder?: string;
  /** Tool to call on search */
  searchTool?: string;
}

export interface FilterChipsProps {
  chips?: FilterChip[];
  /** Tool to call when a chip is toggled */
  filterTool?: string;
}

export interface TabGroupProps {
  tabs?: TabItem[];
  activeTab?: string;
  /** Tool to call when tab changes */
  switchTool?: string;
}

// ─── Action Component Props ─────────────────────────────────

export interface ActionButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Tool to call when clicked */
  toolName?: string;
  /** Arguments to pass to the tool */
  toolArgs?: Record<string, any>;
}

export interface ActionBarProps {
  align?: Alignment;
}

// ─── Extended Data Display Props ────────────────────────────

export interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  size?: CurrencySize;
  positive?: boolean;
  negative?: boolean;
}

export interface TagListProps {
  tags?: (string | TagItem)[];
  maxVisible?: number;
  size?: "sm" | "md";
}

export interface CardGridProps {
  cards?: CardGridItem[];
  columns?: number;
}

export interface AvatarGroupProps {
  avatars?: AvatarItem[];
  max?: number;
  size?: AvatarSize;
}

export interface StarRatingProps {
  rating?: number;
  count?: number;
  maxStars?: number;
  distribution?: StarDistribution[];
  showDistribution?: boolean;
}

export interface StockIndicatorProps {
  quantity: number;
  lowThreshold?: number;
  criticalThreshold?: number;
  label?: string;
}

// ─── Communication Component Props ──────────────────────────

export interface ChatThreadProps {
  messages?: ChatMessage[];
  title?: string;
  /** Tool to call when sending a message */
  sendTool?: string;
}

export interface EmailPreviewProps {
  from: string;
  to: string;
  subject: string;
  date: string;
  body?: string;
  cc?: string;
  attachments?: EmailAttachment[];
}

export interface ContentPreviewProps {
  content?: string;
  format?: ContentFormat;
  maxHeight?: number;
  title?: string;
}

export interface TranscriptViewProps {
  entries?: TranscriptEntry[];
  title?: string;
  duration?: string;
}

export interface AudioPlayerProps {
  title?: string;
  duration?: string;
  type?: AudioType;
}

export interface ChecklistViewProps {
  items?: ChecklistItem[];
  title?: string;
  showProgress?: boolean;
  /** Tool to call when toggling a checklist item */
  toggleTool?: string;
}

// ─── Visualization Component Props ──────────────────────────

export interface CalendarViewProps {
  title?: string;
  events?: CalendarEvent[];
  highlightToday?: boolean;
  year?: number;
  month?: number;
}

export interface FlowDiagramProps {
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  direction?: FlowDirection;
  title?: string;
}

export interface TreeViewProps {
  nodes?: TreeNode[];
  title?: string;
  expandAll?: boolean;
}

export interface MediaGalleryProps {
  items?: MediaItem[];
  columns?: number;
  title?: string;
}

export interface DuplicateCompareProps {
  records?: CompareRecord[];
  highlightDiffs?: boolean;
  title?: string;
  /** Tool to call when merging records */
  mergeTool?: string;
}

// ─── Chart Component Props ──────────────────────────────────

export interface BarChartProps {
  bars?: BarChartBar[];
  orientation?: ChartOrientation;
  maxValue?: number;
  showValues?: boolean;
  title?: string;
}

export interface LineChartProps {
  points?: LineChartPoint[];
  color?: string;
  showPoints?: boolean;
  showArea?: boolean;
  title?: string;
  yAxisLabel?: string;
}

export interface PieChartProps {
  segments?: PieSegment[];
  donut?: boolean;
  title?: string;
  showLegend?: boolean;
}

export interface FunnelChartProps {
  stages?: FunnelStage[];
  showDropoff?: boolean;
  title?: string;
}

export interface SparklineChartProps {
  values?: number[];
  color?: string;
  height?: number;
  width?: number;
}

// ─── New Interactive Component Props ────────────────────────

export interface ContactPickerProps {
  /** Tool to call to search contacts */
  searchTool?: string;
  /** Currently selected contact ID */
  selectedId?: string;
  /** Label for the picker */
  label?: string;
  placeholder?: string;
  /** Tool to call when a contact is selected */
  selectTool?: string;
}

export interface InvoiceBuilderProps {
  /** Pre-populated line items */
  items?: LineItem[];
  currency?: string;
  /** Tool to create the invoice */
  createTool?: string;
  /** Tool to search for contacts (for bill-to) */
  contactSearchTool?: string;
}

export interface OpportunityEditorProps {
  /** Current field values */
  fields?: Record<string, any>;
  /** Pipeline stages for the dropdown */
  stages?: { id: string; label: string }[];
  /** Tool to save changes */
  saveTool?: string;
}

export interface AppointmentBookerProps {
  /** Available time slots */
  slots?: { date: string; time: string; available: boolean }[];
  /** Tool to fetch calendar availability */
  calendarTool?: string;
  /** Tool to book the appointment */
  bookTool?: string;
  /** Calendar ID to book against */
  calendarId?: string;
  /** Tool to search contacts for the appointment */
  contactSearchTool?: string;
}

export interface EditableFieldProps {
  /** Current value */
  value?: string;
  /** Field label */
  label?: string;
  /** Field type */
  fieldType?: "text" | "number" | "email" | "tel";
  /** Tool to save changes */
  saveTool?: string;
  /** Arguments to pass alongside the new value */
  saveArgs?: Record<string, any>;
}

export interface SelectDropdownProps {
  /** Options to display */
  options?: { value: string; label: string }[];
  /** Currently selected value */
  selectedValue?: string;
  /** Label for the dropdown */
  label?: string;
  placeholder?: string;
  /** Tool to call to load options asynchronously */
  loadTool?: string;
  /** Tool to call when selection changes */
  changeTool?: string;
}

export interface FormGroupProps {
  /** Form field definitions */
  fields?: {
    key: string;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
  }[];
  /** Tool to call on form submit */
  submitTool?: string;
  /** Submit button label */
  submitLabel?: string;
}

export interface AmountInputProps {
  /** Current amount */
  value?: number;
  /** Currency code */
  currency?: string;
  /** Label for the input */
  label?: string;
  /** Min value */
  min?: number;
  /** Max value */
  max?: number;
}

// ─── Component Props Union (for registry typing) ────────────

export type ComponentProps =
  | PageHeaderProps
  | CardProps
  | StatsGridProps
  | SplitLayoutProps
  | SectionProps
  | DataTableProps
  | KanbanBoardProps
  | MetricCardProps
  | StatusBadgeProps
  | TimelineProps
  | ProgressBarProps
  | DetailHeaderProps
  | KeyValueListProps
  | LineItemsTableProps
  | InfoBlockProps
  | SearchBarProps
  | FilterChipsProps
  | TabGroupProps
  | ActionButtonProps
  | ActionBarProps
  | CurrencyDisplayProps
  | TagListProps
  | CardGridProps
  | AvatarGroupProps
  | StarRatingProps
  | StockIndicatorProps
  | ChatThreadProps
  | EmailPreviewProps
  | ContentPreviewProps
  | TranscriptViewProps
  | AudioPlayerProps
  | ChecklistViewProps
  | CalendarViewProps
  | FlowDiagramProps
  | TreeViewProps
  | MediaGalleryProps
  | DuplicateCompareProps
  | BarChartProps
  | LineChartProps
  | PieChartProps
  | FunnelChartProps
  | SparklineChartProps
  | ContactPickerProps
  | InvoiceBuilderProps
  | OpportunityEditorProps
  | AppointmentBookerProps
  | EditableFieldProps
  | SelectDropdownProps
  | FormGroupProps
  | AmountInputProps;
