/**
 * Coupon Manager — Coupons table with status badges and create action.
 */
import React, { useState, useMemo } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { MCPAppProvider } from "../../context/MCPAppContext";
import { ChangeTrackerProvider } from "../../context/ChangeTrackerContext";
import { PageHeader } from "../../components/layout/PageHeader";
import { DataTable } from "../../components/data/DataTable";
import { ActionButton } from "../../components/shared/ActionButton";
import type { TableColumn, StatusVariant } from "../../types";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Data Shape ─────────────────────────────────────────────

interface Coupon {
  id?: string;
  code?: string;
  type?: string;
  discountType?: string;
  value?: number;
  amount?: number;
  uses?: number;
  usesCount?: number;
  maxUses?: number;
  status?: string;
  expiry?: string;
  expiryDate?: string;
  currency?: string;
}

interface AppData {
  coupons?: Coupon[];
  currency?: string;
  createTool?: string;
}

// ─── Helpers ────────────────────────────────────────────────

function extractData(result: CallToolResult): AppData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as AppData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as AppData;
        } catch {
          continue;
        }
      }
    }
  }
  return null;
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

function couponStatusVariant(coupon: Coupon): StatusVariant {
  const s = (coupon.status || "").toLowerCase();
  if (s === "expired") return "error";
  if (s === "maxed" || s === "depleted") return "lost";
  if (s === "active") return "active";
  if (s === "inactive" || s === "disabled") return "draft";

  // Auto-detect from data
  const expiry = coupon.expiry || coupon.expiryDate;
  if (expiry && new Date(expiry) < new Date()) return "error";
  const uses = coupon.uses ?? coupon.usesCount ?? 0;
  if (coupon.maxUses && uses >= coupon.maxUses) return "lost";

  return "active";
}

function couponStatusLabel(coupon: Coupon): string {
  const s = (coupon.status || "").toLowerCase();
  if (s) return coupon.status!;

  const expiry = coupon.expiry || coupon.expiryDate;
  if (expiry && new Date(expiry) < new Date()) return "Expired";
  const uses = coupon.uses ?? coupon.usesCount ?? 0;
  if (coupon.maxUses && uses >= coupon.maxUses) return "Maxed Out";

  return "Active";
}

function formatValue(coupon: Coupon, currency = "USD"): string {
  const val = coupon.value ?? coupon.amount ?? 0;
  const type = (coupon.type || coupon.discountType || "").toLowerCase();

  if (type === "percent" || type === "percentage") {
    return `${val}%`;
  }

  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(val);
  } catch {
    return `$${val.toFixed(2)}`;
  }
}

const STATUS_FILTERS = ["all", "active", "expired", "maxed"] as const;

// ─── App ────────────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<AppData | null>((window as any).__MCP_APP_DATA__ || null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: "Coupon Manager", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      setAppInstance(app);
      app.ontoolresult = async (result) => {
        const extracted = extractData(result);
        if (extracted) setData(extracted);
      };
    },
  });

  const coupons = data?.coupons || [];
  const currency = data?.currency || "USD";
  const createTool = data?.createTool;

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    if (activeFilter === "all") return coupons;

    return coupons.filter((coupon) => {
      const label = couponStatusLabel(coupon).toLowerCase();
      if (activeFilter === "maxed") {
        return label === "maxed out" || label === "maxed" || label === "depleted";
      }
      return label === activeFilter;
    });
  }, [coupons, activeFilter]);

  // Build table rows
  const rows = useMemo(() => filteredCoupons.map((coupon) => ({
    id: coupon.id || coupon.code || "",
    code: coupon.code || "—",
    type: (coupon.type || coupon.discountType || "—").charAt(0).toUpperCase() +
      (coupon.type || coupon.discountType || "—").slice(1),
    value: formatValue(coupon, currency),
    uses: `${coupon.uses ?? coupon.usesCount ?? 0}${coupon.maxUses ? ` / ${coupon.maxUses}` : ""}`,
    status: couponStatusLabel(coupon),
    expiry: formatDate(coupon.expiry || coupon.expiryDate),
  })), [filteredCoupons, currency]);

  const columns: TableColumn[] = useMemo(() => [
    { key: "code", label: "Code", sortable: true },
    { key: "type", label: "Type", sortable: true },
    { key: "value", label: "Value", sortable: true },
    { key: "uses", label: "Uses", sortable: true },
    { key: "status", label: "Status", sortable: true, format: "status" },
    { key: "expiry", label: "Expiry", sortable: true, format: "date" },
  ], []);

  // Stats
  const activeCount = coupons.filter(
    (c) => couponStatusLabel(c).toLowerCase() === "active",
  ).length;
  const expiredCount = coupons.filter(
    (c) => couponStatusLabel(c).toLowerCase() === "expired",
  ).length;

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;
  }

  return (
    <MCPAppProvider app={appInstance}>
      <ChangeTrackerProvider>
        <div>
          <PageHeader
            title="Coupon Manager"
            subtitle={`${coupons.length} coupon${coupons.length !== 1 ? "s" : ""}`}
            stats={[
              { label: "Active", value: String(activeCount) },
              { label: "Expired", value: String(expiredCount) },
            ]}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="filter-chips">
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

            {createTool && (
              <ActionButton
                label="+ New Coupon"
                variant="primary"
                size="sm"
                toolName={createTool}
              />
            )}
          </div>

          <DataTable
            columns={columns}
            rows={rows}
            pageSize={10}
            emptyMessage="No coupons found"
          />
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}
