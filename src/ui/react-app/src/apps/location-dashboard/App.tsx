/**
 * Location Dashboard — Main overview dashboard for a GHL location.
 * Stats: total contacts, active deals, total pipeline value, upcoming appointments.
 * Pie chart: deals by stage. Table: recent contacts. Sparklines in metric cards.
 */
import React, { useMemo } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PageHeader } from "../../components/layout/PageHeader.js";
import { StatsGrid } from "../../components/layout/StatsGrid.js";
import { SplitLayout } from "../../components/layout/SplitLayout.js";
import { Section } from "../../components/layout/Section.js";
import { Card } from "../../components/layout/Card.js";
import { MetricCard } from "../../components/data/MetricCard.js";
import { DataTable } from "../../components/data/DataTable.js";
import { PieChart } from "../../components/charts/PieChart.js";
import { SparklineChart } from "../../components/charts/SparklineChart.js";
import { CurrencyDisplay } from "../../components/data/CurrencyDisplay.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface Contact {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  dateAdded?: string;
  tags?: string[];
  source?: string;
}

interface Pipeline {
  id: string;
  name: string;
  stages?: PipelineStage[];
}

interface PipelineStage {
  id: string;
  name: string;
  count: number;
  value: number;
}

interface CalendarEntry {
  id?: string;
  title: string;
  date: string;
  time?: string;
}

interface LocationDashboardData {
  recentContacts: Contact[];
  pipelines: Pipeline[];
  calendars: CalendarEntry[];
  locationId: string;
  locationName?: string;
  totalContacts?: number;
  contactsTrend?: number[];
  activeDeals?: number;
  dealsTrend?: number[];
  totalPipelineValue?: number;
  valueTrend?: number[];
  upcomingAppointments?: number;
  appointmentsTrend?: number[];
}

// ─── Data Extraction ────────────────────────────────────────

function extractData(result: CallToolResult): LocationDashboardData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as LocationDashboardData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as LocationDashboardData;
        } catch {
          /* skip */
        }
      }
    }
  }
  return null;
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = React.useState<LocationDashboardData | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "location-dashboard", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const extracted = extractData(result);
        if (extracted) setData(extracted);
      };
    },
  });

  React.useEffect(() => {
    const preInjected = (window as any).__MCP_APP_DATA__;
    if (preInjected && !data) setData(preInjected as LocationDashboardData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Aggregate deals by stage across all pipelines
  const dealsByStage = useMemo(() => {
    if (!data?.pipelines) return [];
    const stageMap: Record<string, number> = {};
    for (const pipeline of data.pipelines) {
      for (const stage of pipeline.stages ?? []) {
        stageMap[stage.name] = (stageMap[stage.name] ?? 0) + stage.count;
      }
    }
    return Object.entries(stageMap).map(([label, value]) => ({ label, value }));
  }, [data?.pipelines]);

  // Compute totals from pipeline data if not provided directly
  const totalContacts = data?.totalContacts ?? data?.recentContacts?.length ?? 0;
  const activeDeals = useMemo(() => {
    if (data?.activeDeals != null) return data.activeDeals;
    return dealsByStage.reduce((sum, s) => sum + s.value, 0);
  }, [data?.activeDeals, dealsByStage]);

  const totalPipelineValue = useMemo(() => {
    if (data?.totalPipelineValue != null) return data.totalPipelineValue;
    if (!data?.pipelines) return 0;
    let total = 0;
    for (const pipeline of data.pipelines) {
      for (const stage of pipeline.stages ?? []) {
        total += stage.value;
      }
    }
    return total;
  }, [data?.totalPipelineValue, data?.pipelines]);

  const upcomingAppointments = data?.upcomingAppointments ?? data?.calendars?.length ?? 0;

  const contactColumns = useMemo(() => [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", format: "email" as const },
    { key: "phone", label: "Phone", format: "phone" as const },
    { key: "source", label: "Source" },
    { key: "dateAdded", label: "Date Added", sortable: true, format: "date" as const },
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
        title={data.locationName ?? "Location Dashboard"}
        subtitle={`Location ID: ${data.locationId}`}
        gradient
        stats={[
          { label: "Contacts", value: totalContacts.toLocaleString() },
          { label: "Active Deals", value: activeDeals.toLocaleString() },
          { label: "Upcoming", value: upcomingAppointments.toLocaleString() },
        ]}
      />

      <StatsGrid columns={4}>
        <div className="metric-card">
          <div className="metric-value metric-blue">{totalContacts.toLocaleString()}</div>
          <div className="metric-label">Total Contacts</div>
          {data.contactsTrend && data.contactsTrend.length > 1 && (
            <SparklineChart values={data.contactsTrend} color="#3b82f6" height={20} width={80} />
          )}
        </div>
        <div className="metric-card">
          <div className="metric-value metric-green">{activeDeals.toLocaleString()}</div>
          <div className="metric-label">Active Deals</div>
          {data.dealsTrend && data.dealsTrend.length > 1 && (
            <SparklineChart values={data.dealsTrend} color="#16a34a" height={20} width={80} />
          )}
        </div>
        <div className="metric-card">
          <div className="metric-value metric-purple">
            <CurrencyDisplay amount={totalPipelineValue} size="sm" />
          </div>
          <div className="metric-label">Pipeline Value</div>
          {data.valueTrend && data.valueTrend.length > 1 && (
            <SparklineChart values={data.valueTrend} color="#7c3aed" height={20} width={80} />
          )}
        </div>
        <div className="metric-card">
          <div className="metric-value">{upcomingAppointments.toLocaleString()}</div>
          <div className="metric-label">Upcoming Appointments</div>
          {data.appointmentsTrend && data.appointmentsTrend.length > 1 && (
            <SparklineChart values={data.appointmentsTrend} color="#4f46e5" height={20} width={80} />
          )}
        </div>
      </StatsGrid>

      <SplitLayout ratio="50/50" gap="md">
        <Card title="Deals by Stage">
          <PieChart
            segments={dealsByStage}
            donut
            showLegend
            title=""
          />
        </Card>
        <Card title="Pipeline Summary">
          <div style={{ fontSize: 12 }}>
            {(data.pipelines || []).map((p) => (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <strong>{p.name}</strong>
                <div style={{ color: "#6b7280", marginTop: 2 }}>
                  {(p.stages ?? []).length} stages ·{" "}
                  {(p.stages ?? []).reduce((s, st) => s + st.count, 0)} deals ·{" "}
                  <CurrencyDisplay
                    amount={(p.stages ?? []).reduce((s, st) => s + st.value, 0)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </SplitLayout>

      <Section title="Recent Contacts">
        <DataTable
          columns={contactColumns}
          rows={data.recentContacts || []}
          pageSize={10}
          emptyMessage="No recent contacts"
        />
      </Section>
    </div>
  );
}
