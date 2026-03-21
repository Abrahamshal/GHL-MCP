/**
 * Component Registry — Maps component type strings to React components.
 * All 50 component types registered with real implementations.
 */
import React from "react";

// ─── Layout (5) — Agent Bravo ───────────────────────────────
import { PageHeader } from '../components/layout/PageHeader.js';
import { Card } from '../components/layout/Card.js';
import { StatsGrid } from '../components/layout/StatsGrid.js';
import { SplitLayout } from '../components/layout/SplitLayout.js';
import { Section } from '../components/layout/Section.js';

// ─── Core Data (10) — Agent Bravo ───────────────────────────
import { DataTable } from '../components/data/DataTable.js';
import { KanbanBoard } from '../components/data/KanbanBoard.js';
import { MetricCard } from '../components/data/MetricCard.js';
import { StatusBadge } from '../components/data/StatusBadge.js';
import { Timeline } from '../components/data/Timeline.js';
import { ProgressBar } from '../components/data/ProgressBar.js';
import { DetailHeader } from '../components/data/DetailHeader.js';
import { KeyValueList } from '../components/data/KeyValueList.js';
import { LineItemsTable } from '../components/data/LineItemsTable.js';
import { InfoBlock } from '../components/data/InfoBlock.js';

// ─── Extended Data (6) — Agent Charlie ──────────────────────
import { CurrencyDisplay } from '../components/data/CurrencyDisplay.js';
import { TagList } from '../components/data/TagList.js';
import { CardGrid } from '../components/data/CardGrid.js';
import { AvatarGroup } from '../components/data/AvatarGroup.js';
import { StarRating } from '../components/data/StarRating.js';
import { StockIndicator } from '../components/data/StockIndicator.js';

// ─── Comms Extra (2) — Agent Charlie ────────────────────────
import { ChecklistView } from '../components/data/ChecklistView.js';
import { AudioPlayer } from '../components/data/AudioPlayer.js';

// ─── Navigation (3) — Agent Charlie ─────────────────────────
import { SearchBar } from '../components/shared/SearchBar.js';
import { FilterChips } from '../components/shared/FilterChips.js';
import { TabGroup } from '../components/shared/TabGroup.js';

// ─── Actions (2) — Agent Charlie ────────────────────────────
import { ActionButton } from '../components/shared/ActionButton.js';
import { ActionBar } from '../components/shared/ActionBar.js';

// ─── Communications (4) — Agent Delta ───────────────────────
import { ChatThread } from '../components/comms/ChatThread.js';
import { EmailPreview } from '../components/comms/EmailPreview.js';
import { ContentPreview } from '../components/comms/ContentPreview.js';
import { TranscriptView } from '../components/comms/TranscriptView.js';

// ─── Visualization (5) — Agent Delta ────────────────────────
import { CalendarView } from '../components/viz/CalendarView.js';
import { FlowDiagram } from '../components/viz/FlowDiagram.js';
import { TreeView } from '../components/viz/TreeView.js';
import { MediaGallery } from '../components/viz/MediaGallery.js';
import { DuplicateCompare } from '../components/viz/DuplicateCompare.js';

// ─── Charts (5) — Agent Delta ───────────────────────────────
import { BarChart } from '../components/charts/BarChart.js';
import { LineChart } from '../components/charts/LineChart.js';
import { PieChart } from '../components/charts/PieChart.js';
import { FunnelChart } from '../components/charts/FunnelChart.js';
import { SparklineChart } from '../components/charts/SparklineChart.js';

// ─── Interactive (8) — Agent Echo ───────────────────────────
import { ContactPicker } from '../components/interactive/ContactPicker.js';
import { InvoiceBuilder } from '../components/interactive/InvoiceBuilder.js';
import { OpportunityEditor } from '../components/interactive/OpportunityEditor.js';
import { AppointmentBooker } from '../components/interactive/AppointmentBooker.js';
import { EditableField } from '../components/interactive/EditableField.js';
import { SelectDropdown } from '../components/interactive/SelectDropdown.js';
import { FormGroup } from '../components/interactive/FormGroup.js';
import { AmountInput } from '../components/interactive/AmountInput.js';

// ─── Registry ───────────────────────────────────────────────

export type MCPComponent = React.FC<any>;

const registry: Record<string, MCPComponent> = {
  // Layout (5)
  PageHeader,
  Card,
  StatsGrid,
  SplitLayout,
  Section,

  // Core Data (10)
  DataTable,
  KanbanBoard,
  MetricCard,
  StatusBadge,
  Timeline,
  ProgressBar,
  DetailHeader,
  KeyValueList,
  LineItemsTable,
  InfoBlock,

  // Extended Data (6)
  CurrencyDisplay,
  TagList,
  CardGrid,
  AvatarGroup,
  StarRating,
  StockIndicator,

  // Comms Extra (2)
  ChecklistView,
  AudioPlayer,

  // Navigation (3)
  SearchBar,
  FilterChips,
  TabGroup,

  // Actions (2)
  ActionButton,
  ActionBar,

  // Communications (4)
  ChatThread,
  EmailPreview,
  ContentPreview,
  TranscriptView,

  // Visualization (5)
  CalendarView,
  FlowDiagram,
  TreeView,
  MediaGallery,
  DuplicateCompare,

  // Charts (5)
  BarChart,
  LineChart,
  PieChart,
  FunnelChart,
  SparklineChart,

  // Interactive (8)
  ContactPicker,
  InvoiceBuilder,
  OpportunityEditor,
  AppointmentBooker,
  EditableField,
  SelectDropdown,
  FormGroup,
  AmountInput,
};

/**
 * Register a real component implementation (for dynamic registration).
 */
export function registerComponent(typeName: string, component: MCPComponent): void {
  registry[typeName] = component;
}

/**
 * Get a component by type name. Returns undefined if not registered.
 */
export function getComponent(typeName: string): MCPComponent | undefined {
  return registry[typeName];
}

/**
 * Get all registered component type names.
 */
export function getRegisteredTypes(): string[] {
  return Object.keys(registry);
}

export default registry;
