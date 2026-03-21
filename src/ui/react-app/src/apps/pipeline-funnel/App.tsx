/**
 * Pipeline Funnel — Conversion funnel visualization.
 * Funnel showing stage-to-stage conversion.
 * Stats: total value, win rate, avg time in stage.
 * Table: deals by stage with values.
 * Drop-off percentages between stages.
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
import { FunnelChart } from "../../components/charts/FunnelChart.js";
import { DataTable } from "../../components/data/DataTable.js";
import { KeyValueList } from "../../components/data/KeyValueList.js";
import { CurrencyDisplay } from "../../components/data/CurrencyDisplay.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface PipelineInfo {
  id: string;
  name: string;
  stages?: PipelineStageInfo[];
}

interface PipelineStageInfo {
  id: string;
  name: string;
  position?: number;
}

interface PipelineOpportunity {
  id?: string;
  name: string;
  value: number;
  stageId: string;
  stageName?: string;
  status?: string;
  contact?: string;
  createdAt?: string;
  daysInStage?: number;
}

interface PipelineFunnelData {
  pipeline: PipelineInfo;
  opportunities: PipelineOpportunity[];
}

// ─── Data Extraction ────────────────────────────────────────

function extractData(result: CallToolResult): PipelineFunnelData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as PipelineFunnelData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as PipelineFunnelData;
        } catch {
          /* skip */
        }
      }
    }
  }
  return null;
}

// ─── Helpers ────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = React.useState<PipelineFunnelData | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "pipeline-funnel", version: "1.0.0" },
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
    if (preInjected && !data) setData(preInjected as PipelineFunnelData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Aggregate by stage ────────────────────────────────

  const stageOrder = useMemo(() => {
    const stages = data?.pipeline?.stages ?? [];
    return [...stages].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [data?.pipeline?.stages]);

  const stageStats = useMemo(() => {
    const opps = data?.opportunities ?? [];
    const stageMap: Record<string, { count: number; totalValue: number; totalDays: number }> = {};

    for (const opp of opps) {
      const key = opp.stageId;
      if (!stageMap[key]) stageMap[key] = { count: 0, totalValue: 0, totalDays: 0 };
      stageMap[key].count += 1;
      stageMap[key].totalValue += opp.value;
      stageMap[key].totalDays += opp.daysInStage ?? 0;
    }

    return stageMap;
  }, [data?.opportunities]);

  // Funnel stages ordered
  const funnelStages = useMemo(() => {
    if (stageOrder.length === 0) {
      // Fallback: derive from opportunities
      const stageNames = new Map<string, number>();
      for (const opp of data?.opportunities ?? []) {
        const name = opp.stageName ?? opp.stageId;
        stageNames.set(name, (stageNames.get(name) ?? 0) + 1);
      }
      return Array.from(stageNames.entries())
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => ({ label, value }));
    }
    return stageOrder.map((stage) => ({
      label: stage.name,
      value: stageStats[stage.id]?.count ?? 0,
    }));
  }, [stageOrder, stageStats, data?.opportunities]);

  // ─── KPIs ──────────────────────────────────────────────

  const totalValue = useMemo(
    () => (data?.opportunities ?? []).reduce((s, o) => s + o.value, 0),
    [data?.opportunities],
  );

  const totalDeals = data?.opportunities?.length ?? 0;

  const wonDeals = useMemo(
    () => (data?.opportunities ?? []).filter((o) => o.status === "won").length,
    [data?.opportunities],
  );

  const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : "0.0";

  const avgDaysInStage = useMemo(() => {
    const opps = (data?.opportunities ?? []).filter((o) => o.daysInStage != null);
    if (opps.length === 0) return 0;
    return Math.round(opps.reduce((s, o) => s + (o.daysInStage ?? 0), 0) / opps.length);
  }, [data?.opportunities]);

  // ─── Stage detail rows for table ───────────────────────

  const stageTableRows = useMemo(() => {
    if (stageOrder.length > 0) {
      return stageOrder.map((stage) => {
        const stats = stageStats[stage.id];
        return {
          id: stage.id,
          stage: stage.name,
          deals: stats?.count ?? 0,
          totalValue: formatCurrency(stats?.totalValue ?? 0),
          avgDays: stats?.count ? Math.round(stats.totalDays / stats.count) : 0,
        };
      });
    }
    // Fallback
    const stageMap = new Map<string, { count: number; value: number; days: number }>();
    for (const opp of data?.opportunities ?? []) {
      const name = opp.stageName ?? opp.stageId;
      const cur = stageMap.get(name) ?? { count: 0, value: 0, days: 0 };
      cur.count += 1;
      cur.value += opp.value;
      cur.days += opp.daysInStage ?? 0;
      stageMap.set(name, cur);
    }
    return Array.from(stageMap.entries()).map(([stage, stats]) => ({
      id: stage,
      stage,
      deals: stats.count,
      totalValue: formatCurrency(stats.value),
      avgDays: stats.count > 0 ? Math.round(stats.days / stats.count) : 0,
    }));
  }, [stageOrder, stageStats, data?.opportunities]);

  const stageColumns = useMemo(() => [
    { key: "stage", label: "Stage", sortable: true },
    { key: "deals", label: "Deals", sortable: true },
    { key: "totalValue", label: "Total Value", sortable: true },
    { key: "avgDays", label: "Avg Days in Stage", sortable: true },
  ], []);

  // ─── Conversion drop-off detail (KeyValueList) ────────

  const dropoffItems = useMemo(() => {
    if (funnelStages.length < 2) return [];
    return funnelStages.slice(1).map((stage, i) => {
      const prev = funnelStages[i];
      const dropPct = prev.value > 0
        ? (((prev.value - stage.value) / prev.value) * 100).toFixed(1)
        : "0.0";
      const convPct = prev.value > 0
        ? ((stage.value / prev.value) * 100).toFixed(1)
        : "0.0";
      return {
        label: `${prev.label} → ${stage.label}`,
        value: `${convPct}% conversion (−${dropPct}% drop-off)`,
      };
    });
  }, [funnelStages]);

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
        title={data.pipeline?.name ?? "Pipeline Funnel"}
        subtitle="Stage-to-stage conversion analysis"
        gradient
        stats={[
          { label: "Total Deals", value: totalDeals.toString() },
          { label: "Total Value", value: formatCurrency(totalValue) },
          { label: "Win Rate", value: `${winRate}%` },
        ]}
      />

      <StatsGrid columns={4}>
        <MetricCard
          label="Total Pipeline Value"
          value={formatCurrency(totalValue)}
          color="green"
        />
        <MetricCard
          label="Win Rate"
          value={`${winRate}%`}
          color={Number(winRate) >= 30 ? "green" : "yellow"}
          trend={Number(winRate) >= 30 ? "up" : "down"}
          trendValue={`${winRate}%`}
        />
        <MetricCard
          label="Avg Days in Stage"
          value={`${avgDaysInStage}d`}
          color="blue"
        />
        <MetricCard
          label="Total Deals"
          value={totalDeals.toString()}
          color="purple"
        />
      </StatsGrid>

      <Section title="Conversion Funnel">
        <FunnelChart
          stages={funnelStages}
          showDropoff
          title={`${data.pipeline?.name ?? "Pipeline"} Funnel`}
        />
      </Section>

      <SplitLayout ratio="50/50" gap="md">
        <Card title="Deals by Stage">
          <DataTable
            columns={stageColumns}
            rows={stageTableRows}
            emptyMessage="No stage data"
          />
        </Card>
        <Card title="Stage Conversion Rates">
          <KeyValueList items={dropoffItems} />
        </Card>
      </SplitLayout>
    </div>
  );
}
