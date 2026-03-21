/**
 * Revenue Dashboard — Revenue charts + KPIs.
 * Stats: total revenue, MRR, outstanding, avg deal value.
 * Line chart: revenue over time (aggregated from invoices by month).
 * Pie chart: revenue by source/pipeline.
 * Bar chart: top deals by value.
 * Table: recent paid invoices.
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
import { CurrencyDisplay } from "../../components/data/CurrencyDisplay.js";
import { LineChart } from "../../components/charts/LineChart.js";
import { BarChart } from "../../components/charts/BarChart.js";
import { PieChart } from "../../components/charts/PieChart.js";
import { DataTable } from "../../components/data/DataTable.js";
import { SparklineChart } from "../../components/charts/SparklineChart.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface Invoice {
  id?: string;
  name?: string;
  contactName?: string;
  amount: number;
  status: string;
  paidDate?: string;
  createdAt?: string;
  currency?: string;
}

interface Opportunity {
  id?: string;
  name: string;
  value: number;
  pipelineName?: string;
  stageName?: string;
  status?: string;
}

interface RevenueDashboardData {
  invoices: Invoice[];
  opportunities: Opportunity[];
}

// ─── Data Extraction ────────────────────────────────────────

function extractData(result: CallToolResult): RevenueDashboardData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as RevenueDashboardData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as RevenueDashboardData;
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

function formatDate(d?: string): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = React.useState<RevenueDashboardData | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "revenue-dashboard", version: "1.0.0" },
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
    if (preInjected && !data) setData(preInjected as RevenueDashboardData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived KPIs ──────────────────────────────────────

  const paidInvoices = useMemo(
    () => (data?.invoices ?? []).filter((inv) => inv.status === "paid"),
    [data?.invoices],
  );

  const totalRevenue = useMemo(
    () => paidInvoices.reduce((s, inv) => s + inv.amount, 0),
    [paidInvoices],
  );

  const outstandingAmount = useMemo(
    () =>
      (data?.invoices ?? [])
        .filter((inv) => inv.status !== "paid")
        .reduce((s, inv) => s + inv.amount, 0),
    [data?.invoices],
  );

  const avgDealValue = useMemo(() => {
    const opps = data?.opportunities ?? [];
    if (opps.length === 0) return 0;
    return opps.reduce((s, o) => s + o.value, 0) / opps.length;
  }, [data?.opportunities]);

  // MRR estimate: paid invoices from the last 30 days
  const mrr = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    return paidInvoices
      .filter((inv) => {
        const d = inv.paidDate ? new Date(inv.paidDate).getTime() : 0;
        return d >= thirtyDaysAgo;
      })
      .reduce((s, inv) => s + inv.amount, 0);
  }, [paidInvoices]);

  // ─── Revenue over time (aggregate invoices by month) ───

  const revenueOverTime = useMemo(() => {
    const monthMap: Record<string, number> = {};
    for (const inv of paidInvoices) {
      const dateStr = inv.paidDate ?? inv.createdAt;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = (monthMap[key] ?? 0) + inv.amount;
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, value]) => ({ label, value }));
  }, [paidInvoices]);

  // Sparkline from revenue trend
  const revenueTrend = useMemo(
    () => revenueOverTime.map((p) => p.value),
    [revenueOverTime],
  );

  // ─── Revenue by source/pipeline ────────────────────────

  const revenueByPipeline = useMemo(() => {
    const pipeMap: Record<string, number> = {};
    for (const opp of data?.opportunities ?? []) {
      const key = opp.pipelineName ?? "Other";
      pipeMap[key] = (pipeMap[key] ?? 0) + opp.value;
    }
    return Object.entries(pipeMap).map(([label, value]) => ({ label, value }));
  }, [data?.opportunities]);

  // ─── Top deals by value ────────────────────────────────

  const topDeals = useMemo(() => {
    const sorted = [...(data?.opportunities ?? [])].sort((a, b) => b.value - a.value);
    return sorted.slice(0, 10).map((o) => ({
      label: o.name.length > 20 ? o.name.slice(0, 18) + "…" : o.name,
      value: o.value,
    }));
  }, [data?.opportunities]);

  // ─── Recent paid invoices table ────────────────────────

  const recentPaid = useMemo(
    () =>
      [...paidInvoices]
        .sort((a, b) => {
          const da = a.paidDate ?? a.createdAt ?? "";
          const db = b.paidDate ?? b.createdAt ?? "";
          return db.localeCompare(da);
        })
        .slice(0, 20)
        .map((inv, idx) => ({
          id: inv.id ?? `inv-${idx}`,
          name: inv.name ?? inv.contactName ?? "Invoice",
          contactName: inv.contactName ?? "—",
          amount: formatCurrency(inv.amount),
          paidDate: formatDate(inv.paidDate),
        })),
    [paidInvoices],
  );

  const invoiceColumns = useMemo(() => [
    { key: "name", label: "Invoice", sortable: true },
    { key: "contactName", label: "Contact" },
    { key: "amount", label: "Amount", sortable: true },
    { key: "paidDate", label: "Paid Date", sortable: true, format: "date" },
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
        title="Revenue Dashboard"
        subtitle="Financial overview and revenue analytics"
        gradient
        stats={[
          { label: "Total Revenue", value: formatCurrency(totalRevenue) },
          { label: "Invoices", value: (data.invoices?.length ?? 0).toString() },
          { label: "Deals", value: (data.opportunities?.length ?? 0).toString() },
        ]}
      />

      <StatsGrid columns={4}>
        <div className="metric-card">
          <div className="metric-value metric-green">
            <CurrencyDisplay amount={totalRevenue} size="sm" />
          </div>
          <div className="metric-label">Total Revenue</div>
          {revenueTrend.length > 1 && (
            <SparklineChart values={revenueTrend} color="#16a34a" height={20} width={80} />
          )}
        </div>
        <MetricCard
          label="MRR (30d)"
          value={formatCurrency(mrr)}
          color="blue"
          trend={mrr > 0 ? "up" : "flat"}
          trendValue={formatCurrency(mrr)}
        />
        <MetricCard
          label="Outstanding"
          value={formatCurrency(outstandingAmount)}
          color={outstandingAmount > 0 ? "yellow" : "green"}
          trend={outstandingAmount > 0 ? "down" : "flat"}
          trendValue={formatCurrency(outstandingAmount)}
        />
        <MetricCard
          label="Avg Deal Value"
          value={formatCurrency(avgDealValue)}
          color="purple"
        />
      </StatsGrid>

      <Section title="Revenue Over Time">
        <LineChart
          points={revenueOverTime}
          color="#16a34a"
          showArea
          showPoints
          title="Monthly Revenue"
          yAxisLabel="Revenue ($)"
        />
      </Section>

      <SplitLayout ratio="50/50" gap="md">
        <Card title="Revenue by Pipeline">
          <PieChart
            segments={revenueByPipeline}
            donut
            showLegend
          />
        </Card>
        <Card title="Top Deals by Value">
          <BarChart
            bars={topDeals}
            orientation="horizontal"
            showValues
          />
        </Card>
      </SplitLayout>

      <Section title="Recent Paid Invoices">
        <DataTable
          columns={invoiceColumns}
          rows={recentPaid}
          pageSize={10}
          emptyMessage="No paid invoices found"
        />
      </Section>
    </div>
  );
}
