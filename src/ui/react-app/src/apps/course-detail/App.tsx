import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { DetailHeader } from '../../components/data/DetailHeader';
import { StatsGrid } from '../../components/layout/StatsGrid';
import { SplitLayout } from '../../components/layout/SplitLayout';
import { MetricCard } from '../../components/data/MetricCard';
import { ProgressBar } from '../../components/data/ProgressBar';
import { TreeView } from '../../components/viz/TreeView';
import { Card } from '../../components/layout/Card';
import { KeyValueList } from '../../components/data/KeyValueList';
import type { TreeNode, KeyValueItem, StatusVariant } from '../../types';
import '../../styles/base.css';
import '../../styles/interactive.css';

function extractData(result: CallToolResult): any {
  const sc = (result as any).structuredContent;
  if (sc) return sc;
  for (const item of result.content || []) {
    if (item.type === 'text') {
      try { return JSON.parse(item.text); } catch {}
    }
  }
  return null;
}

function formatDate(d?: string): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return d; }
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Course Detail', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  const course = useMemo(() => {
    if (!data) return null;
    return data.course || data;
  }, [data]);

  const treeNodes: TreeNode[] = useMemo(() => {
    if (!course) return [];
    const modules: any[] = course.modules || course.chapters || [];
    if (modules.length > 0) {
      return modules.map((m: any) => ({
        label: m.title || m.name || 'Module',
        icon: '📁',
        badge: m.lessons ? `${m.lessons.length} lessons` : undefined,
        expanded: true,
        children: (m.lessons || m.items || []).map((l: any) => ({
          label: l.title || l.name || 'Lesson',
          icon: l.completed ? '✅' : '📄',
          badge: l.duration || undefined,
        })),
      }));
    }
    const lessons: any[] = course.lessons || [];
    return lessons.map((l: any) => ({
      label: l.title || l.name || 'Lesson',
      icon: l.completed ? '✅' : '📄',
      badge: l.duration || undefined,
    }));
  }, [course]);

  const totalLessons = useMemo(() => {
    if (!course) return 0;
    if (course.totalLessons) return course.totalLessons;
    const modules: any[] = course.modules || course.chapters || [];
    if (modules.length > 0) {
      return modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
    }
    return course.lessons?.length || 0;
  }, [course]);

  const detailItems: KeyValueItem[] = useMemo(() => {
    if (!course) return [];
    return [
      { label: 'Instructor', value: course.instructor || course.author || '—' },
      { label: 'Category', value: course.category || '—' },
      { label: 'Duration', value: course.duration || '—' },
      { label: 'Created', value: formatDate(course.createdAt) },
      { label: 'Last Updated', value: formatDate(course.updatedAt) },
    ];
  }, [course]);

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  const status = course?.status || 'Draft';
  const statusMap: Record<string, StatusVariant> = { published: 'active', active: 'active', draft: 'draft', archived: 'complete' };
  const statusVariant: StatusVariant = statusMap[status.toLowerCase()] || 'pending';
  const avgProgress = course?.avgProgress ?? course?.progress ?? 0;
  const completionRate = course?.completionRate ?? 0;
  const enrolledStudents = course?.enrolledStudents ?? course?.enrollments ?? 0;

  return (
    <div>
      <DetailHeader
        title={course?.title || course?.name || 'Course'}
        subtitle={course?.description ? course.description.slice(0, 150) : ''}
        entityId={course?.id}
        status={status}
        statusVariant={statusVariant}
      />

      <div style={{ margin: '16px 0' }}>
        <ProgressBar
          label="Overall Progress"
          value={avgProgress}
          max={100}
          color="blue"
          showPercent
        />
      </div>

      <StatsGrid columns={4}>
        <MetricCard label="Enrolled Students" value={enrolledStudents.toLocaleString()} color="blue" />
        <MetricCard label="Completion Rate" value={`${completionRate}%`} color="green" />
        <MetricCard label="Avg. Progress" value={`${avgProgress}%`} color="purple" />
        <MetricCard label="Total Lessons" value={String(totalLessons)} color="yellow" />
      </StatsGrid>

      <div style={{ marginTop: 16 }}>
        <SplitLayout ratio="50/50" gap="md">
          <Card title="Course Details">
            <KeyValueList items={detailItems} />
          </Card>

          <Card title="Lessons & Modules">
            {treeNodes.length > 0 ? (
              <TreeView nodes={treeNodes} expandAll />
            ) : (
              <div className="empty-state"><div className="empty-icon">📖</div><p>No lessons available</p></div>
            )}
          </Card>
        </SplitLayout>
      </div>
    </div>
  );
}
