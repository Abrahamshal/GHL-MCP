/**
 * Reviews Dashboard — Review stats + feed.
 * Stats: avg rating, total reviews, response rate.
 * Star rating with distribution chart.
 * Bar chart: ratings distribution (1-5 stars).
 * Table: recent reviews with rating, text, date.
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
import { StarRating } from "../../components/data/StarRating.js";
import { BarChart } from "../../components/charts/BarChart.js";
import { DataTable } from "../../components/data/DataTable.js";
import { SparklineChart } from "../../components/charts/SparklineChart.js";
import "../../styles/base.css";
import "../../styles/interactive.css";

// ─── Types ──────────────────────────────────────────────────

interface ReviewsCount {
  total?: number;
  averageRating?: number;
  responseRate?: number;
  distribution?: Record<string, number>;
  recentTrend?: number[];
}

interface Review {
  id?: string;
  rating: number;
  text?: string;
  reviewerName?: string;
  date?: string;
  source?: string;
  responded?: boolean;
}

interface ReviewsDashboardData {
  reviewsCount: ReviewsCount;
  reviews: Review[];
}

// ─── Data Extraction ────────────────────────────────────────

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

function extractData(result: CallToolResult): ReviewsDashboardData | null {
  const sc = (result as any).structuredContent;
  if (sc) return sc as ReviewsDashboardData;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === "text") {
        try {
          return JSON.parse(item.text) as ReviewsDashboardData;
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
  const [data, setData] = React.useState<ReviewsDashboardData | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: "reviews-dashboard", version: "1.0.0" },
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
    if (preInjected && !data) setData(preInjected as ReviewsDashboardData);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived Data ──────────────────────────────────────

  const totalReviews = data?.reviewsCount?.total ?? data?.reviews?.length ?? 0;

  const avgRating = useMemo(() => {
    if (data?.reviewsCount?.averageRating != null) return data.reviewsCount.averageRating;
    const reviews = data?.reviews ?? [];
    if (reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [data?.reviewsCount?.averageRating, data?.reviews]);

  const responseRate = useMemo(() => {
    if (data?.reviewsCount?.responseRate != null) return data.reviewsCount.responseRate;
    const reviews = data?.reviews ?? [];
    if (reviews.length === 0) return 0;
    const responded = reviews.filter((r) => r.responded).length;
    return (responded / reviews.length) * 100;
  }, [data?.reviewsCount?.responseRate, data?.reviews]);

  // Star distribution for StarRating component
  const starDistribution = useMemo(() => {
    if (data?.reviewsCount?.distribution) {
      return [1, 2, 3, 4, 5].map((stars) => ({
        stars,
        count: data.reviewsCount.distribution?.[String(stars)] ?? 0,
      }));
    }
    // Compute from reviews
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of data?.reviews ?? []) {
      const star = Math.min(5, Math.max(1, Math.round(r.rating)));
      counts[star] = (counts[star] ?? 0) + 1;
    }
    return [1, 2, 3, 4, 5].map((stars) => ({ stars, count: counts[stars] }));
  }, [data?.reviewsCount?.distribution, data?.reviews]);

  // Bar chart for rating distribution
  const ratingBars = useMemo(
    () =>
      starDistribution.map((d) => ({
        label: `${d.stars}★`,
        value: d.count,
        color:
          d.stars >= 4
            ? "#16a34a"
            : d.stars === 3
              ? "#eab308"
              : "#ef4444",
      })),
    [starDistribution],
  );

  // Recent reviews for table
  const recentReviews = useMemo(
    () =>
      [...(data?.reviews ?? [])]
        .sort((a, b) => {
          const da = a.date ?? "";
          const db = b.date ?? "";
          return db.localeCompare(da);
        })
        .slice(0, 20)
        .map((r, idx) => ({
          id: r.id ?? `review-${idx}`,
          rating: "★".repeat(Math.round(r.rating)) + "☆".repeat(5 - Math.round(r.rating)),
          ratingNum: r.rating,
          text: r.text
            ? r.text.length > 80
              ? r.text.slice(0, 78) + "…"
              : r.text
            : "—",
          reviewerName: r.reviewerName ?? "Anonymous",
          date: formatDate(r.date),
          source: r.source ?? "—",
          responded: r.responded ? "Yes" : "No",
        })),
    [data?.reviews],
  );

  const reviewColumns = useMemo(() => [
    { key: "rating", label: "Rating", sortable: true },
    { key: "reviewerName", label: "Reviewer", sortable: true },
    { key: "text", label: "Review" },
    { key: "source", label: "Source" },
    { key: "date", label: "Date", sortable: true, format: "date" },
    { key: "responded", label: "Responded" },
  ], []);

  // Rating trend sparkline
  const ratingTrend = data?.reviewsCount?.recentTrend ?? [];

  // Sentiment label
  const sentimentLabel =
    avgRating >= 4.5
      ? "Excellent"
      : avgRating >= 4.0
        ? "Very Good"
        : avgRating >= 3.5
          ? "Good"
          : avgRating >= 3.0
            ? "Average"
            : "Needs Improvement";

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
        title="Reviews Dashboard"
        subtitle={`Overall: ${sentimentLabel} · ${totalReviews.toLocaleString()} reviews`}
        gradient
        stats={[
          { label: "Avg Rating", value: avgRating.toFixed(1) },
          { label: "Total Reviews", value: totalReviews.toLocaleString() },
          { label: "Response Rate", value: `${responseRate.toFixed(0)}%` },
        ]}
      />

      <StatsGrid columns={3}>
        <div className="metric-card">
          <div className="metric-value metric-green">{avgRating.toFixed(1)}</div>
          <div className="metric-label">Average Rating</div>
          {ratingTrend.length > 1 && (
            <SparklineChart values={ratingTrend} color="#16a34a" height={20} width={80} />
          )}
        </div>
        <MetricCard
          label="Total Reviews"
          value={totalReviews.toLocaleString()}
          color="blue"
          trend={totalReviews > 0 ? "up" : "flat"}
          trendValue={totalReviews.toString()}
        />
        <MetricCard
          label="Response Rate"
          value={`${responseRate.toFixed(0)}%`}
          color={responseRate >= 80 ? "green" : responseRate >= 50 ? "yellow" : "red"}
          trend={responseRate >= 80 ? "up" : "down"}
          trendValue={`${responseRate.toFixed(0)}%`}
        />
      </StatsGrid>

      <SplitLayout ratio="50/50" gap="md">
        <Card title="Rating Overview">
          <StarRating
            rating={avgRating}
            count={totalReviews}
            distribution={starDistribution}
            showDistribution
          />
        </Card>
        <Card title="Rating Distribution">
          <BarChart
            bars={ratingBars}
            orientation="vertical"
            showValues
            title="Reviews by Star Rating"
          />
        </Card>
      </SplitLayout>

      <Section title="Recent Reviews">
        <DataTable
          columns={reviewColumns}
          rows={recentReviews}
          pageSize={10}
          emptyMessage="No reviews found"
        />
      </Section>
    </div>
  );
}
