/**
 * Agent Stats — User/agent performance metrics dashboard.
 * Shows calls made, emails sent, tasks completed, appointments booked.
 * Line chart: activity over time. Bar chart: performance by metric.
 * Table: detailed activity log.
 */
import React, { useMemo } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PageHeader } from "../../components/layout/PageHeader.js";
import { StatsGrid } from "../../components/layout/StatsGrid.js";
import { Section } from "../../components/layout/Section.js";
import { MetricCard } from "../../components/data/MetricCard.js";
import { LineChart } from "../../components/charts/LineChart.js";
import { BarChart } from "../../components/charts/BarChart.js";
import { DataTable } from "../../components/data/DataTable.js";
import { SparklineChart } from "../../components/charts/SparklineChart.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface ActivityEntry {
  date: string;
  type: string;
  description: string;
  contact?: string;
  outcome?: string;
}

interface LocationData {
  name?: string;
  id?: string;
}

interface AgentStatsData {
  userId?: string;
  location: LocationData;
  dateRange: string;
  callsMade?: number;
  emailsSent?: number;
  tasksCompleted?: number;
  appointmentsBooked?: number;
  activityLog?: ActivityEntry[];
  activityOverTime?: { label: string; value: number }[];
}

// ─── Data Extraction ────────────────────────────────────────

function extractData(result: CallToolResult): AgentStatsData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as AgentStatsData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as AgentStatsData;
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
  const [data, setData] = React.useState<AgentStatsData | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "agent-stats", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const extracted = extractData(result);
        if (extracted) setData(extracted);
      };
    },
  });

  // Check for pre-injected data
  React.useEffect(() => {
    const preInjected = (window as any).__MCP_APP_DATA__;
    if (preInjected && !data) setData(preInjected as AgentStatsData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived data
  const callsMade = data?.callsMade ?? 0;
  const emailsSent = data?.emailsSent ?? 0;
  const tasksCompleted = data?.tasksCompleted ?? 0;
  const appointmentsBooked = data?.appointmentsBooked ?? 0;

  const performanceBars = useMemo(() => [
    { label: "Calls", value: callsMade, color: "#4f46e5" },
    { label: "Emails", value: emailsSent, color: "#7c3aed" },
    { label: "Tasks", value: tasksCompleted, color: "#16a34a" },
    { label: "Appts", value: appointmentsBooked, color: "#3b82f6" },
  ], [callsMade, emailsSent, tasksCompleted, appointmentsBooked]);

  const activityPoints = useMemo(
    () => data?.activityOverTime ?? [],
    [data?.activityOverTime],
  );

  const activityLog = useMemo(() => data?.activityLog ?? [], [data?.activityLog]);

  const tableColumns = useMemo(() => [
    { key: "date", label: "Date", sortable: true, format: "date" },
    { key: "type", label: "Type", sortable: true },
    { key: "description", label: "Description" },
    { key: "contact", label: "Contact" },
    { key: "outcome", label: "Outcome" },
  ], []);

  // Sparkline values from activity over time
  const sparklineValues = useMemo(
    () => activityPoints.map((p) => p.value),
    [activityPoints],
  );

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

  const totalActivities = callsMade + emailsSent + tasksCompleted + appointmentsBooked;

  return (
    <div id="app" style={{ padding: 4 }}>
      <PageHeader
        title="Agent Performance"
        subtitle={
          data.userId
            ? `Agent: ${data.userId} · ${data.dateRange}`
            : `All Agents · ${data.dateRange}`
        }
        stats={[
          { label: "Location", value: data.location?.name ?? "—" },
          { label: "Total Activities", value: totalActivities.toLocaleString() },
        ]}
      />

      <StatsGrid columns={4}>
        <MetricCard
          label="Calls Made"
          value={callsMade.toLocaleString()}
          color="blue"
          trend={callsMade > 0 ? "up" : "flat"}
          trendValue={`${callsMade}`}
        />
        <MetricCard
          label="Emails Sent"
          value={emailsSent.toLocaleString()}
          color="purple"
          trend={emailsSent > 0 ? "up" : "flat"}
          trendValue={`${emailsSent}`}
        />
        <MetricCard
          label="Tasks Completed"
          value={tasksCompleted.toLocaleString()}
          color="green"
          trend={tasksCompleted > 0 ? "up" : "flat"}
          trendValue={`${tasksCompleted}`}
        />
        <MetricCard
          label="Appointments Booked"
          value={appointmentsBooked.toLocaleString()}
          color="blue"
          trend={appointmentsBooked > 0 ? "up" : "flat"}
          trendValue={`${appointmentsBooked}`}
        />
      </StatsGrid>

      {sparklineValues.length > 1 && (
        <div style={{ margin: "12px 0", textAlign: "right" }}>
          <span style={{ fontSize: 11, color: "#6b7280", marginRight: 4 }}>Trend:</span>
          <SparklineChart values={sparklineValues} color="#4f46e5" height={20} width={100} />
        </div>
      )}

      <Section title="Activity Over Time">
        <LineChart
          points={activityPoints}
          color="#4f46e5"
          showArea
          showPoints
          title="Activities"
          yAxisLabel="Count"
        />
      </Section>

      <Section title="Performance by Metric">
        <BarChart
          bars={performanceBars}
          orientation="vertical"
          showValues
          title="Metric Breakdown"
        />
      </Section>

      <Section title="Activity Log">
        <DataTable
          columns={tableColumns}
          rows={activityLog}
          pageSize={10}
          emptyMessage="No activities recorded"
        />
      </Section>
    </div>
  );
}
