/**
 * Order List — Orders table with status filtering and stats.
 */
import React, { useState, useMemo } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { PageHeader } from "../../components/layout/PageHeader.js";
import { DataTable } from "../../components/data/DataTable.js";
import { StatsGrid } from "../../components/layout/StatsGrid.js";
import { MetricCard } from "../../components/data/MetricCard.js";
import type { TableColumn } from "../../types.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Data Shape ─────────────────────────────────────────────

interface Order {
  id?: string;
  orderId?: string;
  contact?: string;
  contactName?: string;
  total?: number;
  status?: string;
  items?: number | string;
  itemCount?: number;
  createdAt?: string;
  currency?: string;
}

interface AppData {
  orders?: Order[];
  currency?: string;
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

function formatCurrency(n: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
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

const STATUS_FILTERS = [
  "all",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

// ─── Component ──────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<AppData | null>(
    () => (window as any).__MCP_APP_DATA__ || null
  );
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { isConnected, error } = useApp({
    appInfo: { name: "Order List", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const orders = data?.orders || [];
  const currency = data?.currency || "USD";

  // Compute stats
  const stats = useMemo(() => {
    let totalOrders = orders.length;
    let totalRevenue = 0;
    let pendingCount = 0;

    for (const order of orders) {
      totalRevenue += order.total ?? 0;
      const s = (order.status || "").toLowerCase();
      if (s === "pending" || s === "processing") {
        pendingCount++;
      }
    }

    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalOrders, totalRevenue, avgOrder, pendingCount };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (activeFilter === "all") return orders;
    return orders.filter(
      (order) => (order.status || "").toLowerCase() === activeFilter,
    );
  }, [orders, activeFilter]);

  // Build table rows
  const rows = filteredOrders.map((order) => ({
    id: order.id || order.orderId || "",
    orderId: order.orderId || order.id || "—",
    contact: order.contact || order.contactName || "—",
    total: formatCurrency(order.total ?? 0, order.currency || currency),
    status: order.status || "pending",
    items: String(order.items ?? order.itemCount ?? "—"),
    createdAt: formatDate(order.createdAt),
  }));

  const columns: TableColumn[] = [
    { key: "orderId", label: "Order ID", sortable: true },
    { key: "contact", label: "Contact", sortable: true, format: "avatar" },
    { key: "total", label: "Total", sortable: true, format: "currency" },
    { key: "status", label: "Status", sortable: true, format: "status" },
    { key: "items", label: "Items", sortable: true },
    { key: "createdAt", label: "Created", sortable: true, format: "date" },
  ];

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${orders.length} order${orders.length !== 1 ? "s" : ""}`}
      />

      <StatsGrid columns={4}>
        <MetricCard
          label="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          color="blue"
        />
        <MetricCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue, currency)}
          color="green"
        />
        <MetricCard
          label="Avg Order"
          value={formatCurrency(stats.avgOrder, currency)}
          color="purple"
        />
        <MetricCard
          label="Pending"
          value={stats.pendingCount.toLocaleString()}
          color="yellow"
        />
      </StatsGrid>

      <div className="filter-chips" style={{ margin: "16px 0" }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`chip ${activeFilter === f ? "chip-active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        pageSize={10}
        emptyMessage="No orders found"
      />
    </div>
  );
}
