/**
 * Order Detail — Single order view with line items, shipping, and fulfillment timeline.
 */
import React, { useState } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { DetailHeader } from "../../components/data/DetailHeader.js";
import { SplitLayout } from "../../components/layout/SplitLayout.js";
import { LineItemsTable } from "../../components/data/LineItemsTable.js";
import { KeyValueList } from "../../components/data/KeyValueList.js";
import { Timeline } from "../../components/data/Timeline.js";
import type { StatusVariant, KeyValueItem, LineItem, TimelineEvent } from "../../types.js";
import "../../styles/base.css";

// ─── Data Shape ─────────────────────────────────────────────

interface Order {
  id?: string;
  orderId?: string;
  status?: string;
  contact?: string;
  contactName?: string;
  contactEmail?: string;
  currency?: string;
  createdAt?: string;
  items?: Array<{
    name?: string;
    description?: string;
    quantity?: number;
    unitPrice?: number;
    total?: number;
  }>;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  shippingCost?: number;
  discount?: number;
  total?: number;
  shippingAddress?: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    postalCode?: string;
    country?: string;
  };
  shippingMethod?: string;
  trackingNumber?: string;
  notes?: string;
}

interface Fulfillment {
  id?: string;
  status?: string;
  title?: string;
  description?: string;
  timestamp?: string;
  date?: string;
  trackingNumber?: string;
  carrier?: string;
}

interface AppData {
  order?: Order;
  fulfillments?: Fulfillment[];
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
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
}

function statusVariant(status?: string): StatusVariant {
  const s = (status || "").toLowerCase();
  if (s === "delivered" || s === "completed") return "complete";
  if (s === "shipped") return "sent";
  if (s === "processing") return "active";
  if (s === "pending") return "pending";
  if (s === "cancelled" || s === "refunded") return "lost";
  return "active";
}

function fulfillmentVariant(status?: string): "default" | "success" | "warning" | "error" {
  const s = (status || "").toLowerCase();
  if (s === "delivered" || s === "completed") return "success";
  if (s === "shipped" || s === "in_transit") return "default";
  if (s === "pending") return "warning";
  if (s === "failed" || s === "cancelled") return "error";
  return "default";
}

// ─── Component ──────────────────────────────────────────────

export function App() {
  const [data, setData] = useState<AppData | null>(
    () => (window as any).__MCP_APP_DATA__ || null
  );

  const { isConnected, error } = useApp({
    appInfo: { name: "Order Detail", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const { order, fulfillments = [] } = data;

  if (!order) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📦</div>
        <p>No order data available</p>
      </div>
    );
  }

  const o = order;
  const currency = o.currency || "USD";
  const variant = statusVariant(o.status);

  // Build line items
  const lineItems: LineItem[] = (o.items || []).map((item) => ({
    name: item.name || "Item",
    description: item.description,
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    total: item.total ?? (item.quantity ?? 1) * (item.unitPrice ?? 0),
  }));

  // Order details KV
  const details: KeyValueItem[] = [
    { label: "Order ID", value: o.orderId || o.id || "—" },
    { label: "Date", value: formatDate(o.createdAt) },
    { label: "Customer", value: o.contact || o.contactName || "—" },
  ];
  if (o.contactEmail) {
    details.push({ label: "Email", value: o.contactEmail });
  }

  // Shipping details KV
  const shippingDetails: KeyValueItem[] = [];
  if (o.shippingAddress) {
    const addr = o.shippingAddress;
    const addrLines = [
      addr.name,
      addr.line1,
      addr.line2,
      [addr.city, addr.state, addr.zip || addr.postalCode].filter(Boolean).join(", "),
      addr.country,
    ].filter(Boolean);
    shippingDetails.push({ label: "Address", value: addrLines.join("\n") });
  }
  if (o.shippingMethod) {
    shippingDetails.push({ label: "Method", value: o.shippingMethod });
  }
  if (o.trackingNumber) {
    shippingDetails.push({ label: "Tracking", value: o.trackingNumber });
  }

  // Totals KV
  const totals: KeyValueItem[] = [];
  if (o.subtotal !== undefined) {
    totals.push({ label: "Subtotal", value: formatCurrency(o.subtotal, currency) });
  }
  if (o.discount && o.discount > 0) {
    totals.push({
      label: "Discount",
      value: `-${formatCurrency(o.discount, currency)}`,
      variant: "success",
    });
  }
  if (o.tax !== undefined) {
    totals.push({ label: "Tax", value: formatCurrency(o.tax, currency) });
  }
  const shippingCost = o.shipping ?? o.shippingCost;
  if (shippingCost !== undefined) {
    totals.push({ label: "Shipping", value: formatCurrency(shippingCost, currency) });
  }
  totals.push({
    label: "Total",
    value: formatCurrency(o.total ?? 0, currency),
    isTotalRow: true,
  });

  // Build fulfillment timeline
  const timelineEvents: TimelineEvent[] = fulfillments.map((f) => ({
    title: f.title || f.status || "Update",
    description: [
      f.description,
      f.trackingNumber ? `Tracking: ${f.trackingNumber}` : null,
      f.carrier ? `Carrier: ${f.carrier}` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    timestamp: formatDate(f.timestamp || f.date),
    variant: fulfillmentVariant(f.status),
    icon: "system",
  }));

  return (
    <div>
      <DetailHeader
        title={`Order ${o.orderId || o.id || ""}`}
        entityId={o.id}
        status={o.status || "Pending"}
        statusVariant={variant}
      />

      <SplitLayout ratio="50/50" gap="md">
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Info</h3>
          <KeyValueList items={details} compact />
        </div>
        <div>
          {shippingDetails.length > 0 && (
            <>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shipping</h3>
              <KeyValueList items={shippingDetails} compact />
            </>
          )}
        </div>
      </SplitLayout>

      <div style={{ marginTop: 20 }}>
        <LineItemsTable items={lineItems} currency={currency} />
      </div>

      <div style={{ maxWidth: 360, marginLeft: "auto", marginTop: 16 }}>
        <KeyValueList items={totals} />
      </div>

      {timelineEvents.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Fulfillment Timeline</h3>
          <Timeline events={timelineEvents} />
        </div>
      )}

      {o.notes && (
        <div style={{ marginTop: 16, padding: "12px 16px", background: "#f9fafb", borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 13, color: "#374151", wordBreak: "break-word" }}>{o.notes}</div>
        </div>
      )}
    </div>
  );
}
