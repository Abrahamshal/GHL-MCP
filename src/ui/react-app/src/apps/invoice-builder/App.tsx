/**
 * Invoice Builder — Create invoice form using the InvoiceBuilder component.
 */
import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { InvoiceBuilder } from '../../components/interactive/InvoiceBuilder';
import { Card } from '../../components/layout/Card';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import type { LineItem } from '../../types';
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

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Invoice Builder', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      setAppInstance(a);
      a.ontoolresult = async (result) => {
        const parsed = extractData(result);
        if (parsed) setData(parsed);
      };
    },
  });

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;

  const appData = data || {};

  const initialItems: LineItem[] | undefined = appData.items?.map((item: any) => ({
    name: item.name || item.description || '',
    description: item.description,
    quantity: item.quantity ?? 1,
    unitPrice: item.unitPrice ?? 0,
    total: item.total ?? (item.quantity ?? 1) * (item.unitPrice ?? 0),
  }));

  return (
    <ChangeTrackerProvider>
      <MCPAppProvider app={appInstance}>
        <div>
          <PageHeader
            title="Create Invoice"
            subtitle="Build and send a new invoice"
            status="Draft"
            statusVariant="draft"
          />
          <Card padding="md">
            <InvoiceBuilder
              items={initialItems}
              currency={appData.currency || 'USD'}
              createTool={appData.createTool || 'create_invoice'}
              contactSearchTool={appData.contactSearchTool || 'search_contacts'}
            />
          </Card>
        </div>
      </MCPAppProvider>
    </ChangeTrackerProvider>
  );
}
