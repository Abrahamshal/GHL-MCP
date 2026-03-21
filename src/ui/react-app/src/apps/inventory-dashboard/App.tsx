/**
 * Inventory Dashboard — Stock levels, alerts, and category chart.
 */
import React, { useMemo, useState } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PageHeader } from "../../components/layout/PageHeader.js";
import { StatsGrid } from "../../components/layout/StatsGrid.js";
import { MetricCard } from "../../components/data/MetricCard.js";
import { DataTable } from "../../components/data/DataTable.js";
import { BarChart } from "../../components/charts/BarChart.js";
import type { TableColumn, BarChartBar } from "../../types.js";
import "../../styles/base.css";

// ─── Data Shape ─────────────────────────────────────────────

interface InventoryItem {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  quantity?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  status?: string;
  price?: number;
  currency?: string;
}

interface AppData {
  inventory?: InventoryItem[];
}

// ─── Helpers ────────────────────────────────────────────────

function extractData(result: CallToolResult): AppData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as AppData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try { return JSON.parse(item.text) as AppData; } catch { continue; }
      }
    }
  }
  return null;
}

function stockLevel(qty: number, threshold = 10): string {
  if (qty <= 0) return "🔴 Out of Stock";
  if (qty <= threshold) return "🟡 Low Stock";
  return "🟢 In Stock";
}

// ─── Component ──────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<AppData | null>(
    () => (window as any).__MCP_APP_DATA__ || null
  );

  const { isConnected, error } = useApp({
    appInfo: { name: "Inventory Dashboard", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const inventory = data?.inventory || [];

  // Compute stats
  const stats = useMemo(() => {
    let totalSKUs = inventory.length;
    let lowStock = 0;
    let outOfStock = 0;

    for (const item of inventory) {
      const qty = item.quantity ?? item.stockQuantity ?? 0;
      const threshold = item.lowStockThreshold ?? 10;
      if (qty <= 0) outOfStock++;
      else if (qty <= threshold) lowStock++;
    }

    return { totalSKUs, lowStock, outOfStock };
  }, [inventory]);

  // Build stock by category for bar chart
  const categoryBars: BarChartBar[] = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const item of inventory) {
      const cat = item.category || "Uncategorized";
      const qty = item.quantity ?? item.stockQuantity ?? 0;
      catMap.set(cat, (catMap.get(cat) || 0) + qty);
    }
    return Array.from(catMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [inventory]);

  // Build table rows with stock indicators
  const rows = useMemo(() => inventory.map((item) => {
    const qty = item.quantity ?? item.stockQuantity ?? 0;
    const threshold = item.lowStockThreshold ?? 10;
    return {
      id: item.id || item.sku || "",
      name: item.name || "—",
      sku: item.sku || "—",
      category: item.category || "—",
      quantity: qty.toLocaleString(),
      status: stockLevel(qty, threshold),
    };
  }), [inventory]);

  const columns: TableColumn[] = [
    { key: "name", label: "Product", sortable: true },
    { key: "sku", label: "SKU", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "quantity", label: "Stock", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <div>
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Stock levels and alerts"
      />

      <StatsGrid columns={3}>
        <MetricCard
          label="Total SKUs"
          value={stats.totalSKUs.toLocaleString()}
          color="blue"
        />
        <MetricCard
          label="Low Stock"
          value={stats.lowStock.toLocaleString()}
          color="yellow"
        />
        <MetricCard
          label="Out of Stock"
          value={stats.outOfStock.toLocaleString()}
          color="red"
        />
      </StatsGrid>

      {categoryBars.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <BarChart
            bars={categoryBars}
            orientation="horizontal"
            title="Stock by Category"
            showValues
          />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <DataTable
          columns={columns}
          rows={rows}
          pageSize={15}
          emptyMessage="No inventory items"
        />
      </div>
    </div>
  );
}
