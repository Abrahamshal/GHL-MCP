import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { OpportunityEditor } from '../../components/interactive/OpportunityEditor';
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

function OpportunityEditorInner({ data }: { data: any }) {
  const opp = data.opportunity || {};
  const stages: any[] = data.stages || data.pipeline?.stages || [];

  const fields: Record<string, any> = {
    id: opp.id || '',
    name: opp.name || '',
    monetaryValue: opp.monetaryValue || opp.value || 0,
    status: opp.status || 'open',
    stageId: opp.stageId || opp.pipelineStageId || '',
    source: opp.source || '',
    assignedTo: opp.assignedTo || '',
  };

  const stageOptions = stages.map((s: any) => ({
    id: s.id,
    label: s.name || s.title || 'Unknown',
  }));

  return (
    <PageHeader
      title="Edit Opportunity"
      subtitle={opp.name || 'Opportunity'}
    >
      <Card>
        <OpportunityEditor
          fields={fields}
          stages={stageOptions}
          saveTool="update_opportunity"
        />
      </Card>
    </PageHeader>
  );
}

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Opportunity Editor', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      setAppInstance(app);
      app.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  if (!data) return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for data...</p></div>;

  return (
    <ChangeTrackerProvider>
      <MCPAppProvider app={appInstance}>
        <OpportunityEditorInner data={data} />
      </MCPAppProvider>
    </ChangeTrackerProvider>
  );
}
