import React, { useState, useMemo } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPAppProvider } from '../../context/MCPAppContext';
import { ChangeTrackerProvider } from '../../context/ChangeTrackerContext';
import { DetailHeader } from '../../components/data/DetailHeader';
import { ChatThread } from '../../components/comms/ChatThread';
import { ActionBar } from '../../components/shared/ActionBar';
import { ActionButton } from '../../components/shared/ActionButton';
import type { ChatMessage, StatusVariant } from '../../types';
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

const typeIcons: Record<string, string> = {
  sms: '💬',
  email: '📧',
  call: '📞',
  whatsapp: '📱',
  facebook: '👤',
  instagram: '📸',
};

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [appInstance, setAppInstance] = useState<any>(null);

  const { isConnected, error } = useApp({
    appInfo: { name: 'Conversation Thread', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (app) => {
      setAppInstance(app);
      app.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  const conversation = data?.conversation;
  const rawMessages: any[] = data?.messages || [];

  const messages: ChatMessage[] = useMemo(() => {
    return rawMessages.map((msg) => ({
      content: msg.body || msg.message || msg.content || msg.text || '',
      direction: (msg.direction === 'outbound' || msg.direction === 'outgoing' || msg.type === 'outbound')
        ? 'outbound' as const
        : 'inbound' as const,
      senderName: msg.senderName || msg.contactName || msg.from || (msg.direction === 'outbound' ? 'You' : conversation?.contactName || 'Contact'),
      timestamp: msg.dateAdded || msg.createdAt || msg.timestamp || msg.date || '',
      type: (msg.messageType || msg.type || conversation?.type || 'sms') as ChatMessage['type'],
    }));
  }, [rawMessages, conversation]);

  const contactName = conversation?.contactName || conversation?.contact?.name ||
    [conversation?.contact?.firstName, conversation?.contact?.lastName].filter(Boolean).join(' ') || 'Contact';

  const conversationType = conversation?.type || 'sms';
  const typeIcon = typeIcons[conversationType] || '💬';

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }
  if (!data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Waiting for conversation data...</p></div>;
  }

  const statusVariant: StatusVariant = conversation?.unreadCount > 0 ? 'active' : 'complete';

  return (
    <MCPAppProvider app={appInstance}>
      <ChangeTrackerProvider>
        <div>
          <DetailHeader
            title={`${typeIcon} ${contactName}`}
            subtitle={`${conversationType.toUpperCase()} conversation · ${messages.length} messages`}
            entityId={conversation?.id}
            status={conversation?.unreadCount > 0 ? `${conversation.unreadCount} unread` : undefined}
            statusVariant={statusVariant}
          />

          <ChatThread
            messages={messages}
            title={contactName}
          />

          <ActionBar align="right">
            <ActionButton
              label="Reply"
              variant="primary"
              size="sm"
              toolName="send_message"
              toolArgs={{ conversationId: conversation?.id, contactId: conversation?.contactId }}
            />
          </ActionBar>
        </div>
      </ChangeTrackerProvider>
    </MCPAppProvider>
  );
}
