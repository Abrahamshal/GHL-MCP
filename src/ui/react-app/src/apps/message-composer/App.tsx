import React, { useState } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/layout/Card';
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

type MessageTab = 'sms' | 'email';

export function App() {
  const [data, setData] = useState<any>((window as any).__MCP_APP_DATA__ || null);
  const [activeTab, setActiveTab] = useState<MessageTab>('sms');

  // SMS fields
  const [smsPhone, setSmsPhone] = useState('');
  const [smsBody, setSmsBody] = useState('');

  // Email fields
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Message Composer', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (result) => {
        const d = extractData(result);
        if (d) setData(d);
      };
    },
  });

  // Pre-fill from contact data
  const contact = data?.contact;
  const prefillPhone = contact?.phone || '';
  const prefillEmail = contact?.email || '';
  const contactName = contact?.name || [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || '';

  const handleSend = async () => {
    if (!app) return;
    setIsSending(true);
    setSendResult(null);

    try {
      if (activeTab === 'sms') {
        const phone = smsPhone || prefillPhone;
        if (!phone || !smsBody.trim()) { setIsSending(false); return; }
        await app.updateModelContext({
          content: [{
            type: 'text',
            text: `User action: Send SMS to ${phone}: "${smsBody.trim()}"`,
          }],
        });
      } else {
        const to = emailTo || prefillEmail;
        if (!to || !emailSubject.trim() || !emailBody.trim()) { setIsSending(false); return; }
        await app.updateModelContext({
          content: [{
            type: 'text',
            text: `User action: Send email to ${to}, subject: "${emailSubject.trim()}", body: "${emailBody.trim()}"`,
          }],
        });
      }
      setSendResult('success');
    } catch {
      setSendResult('error');
    } finally {
      setIsSending(false);
    }
  };

  if (error) {
    return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  }
  if (!isConnected && !data) {
    return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;
  }

  const tabs: { label: string; value: MessageTab; icon: string }[] = [
    { label: 'SMS', value: 'sms', icon: '💬' },
    { label: 'Email', value: 'email', icon: '📧' },
  ];

  return (
    <div>
      <PageHeader
        title="Compose Message"
        subtitle={contactName ? `To: ${contactName}` : 'Send an SMS or email'}
      />

      {/* Contact info */}
      {contact && (
        <Card padding="sm">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
              {(contactName || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{contactName || 'Contact'}</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>
                {prefillPhone && `📞 ${prefillPhone}`}
                {prefillPhone && prefillEmail && ' · '}
                {prefillEmail && `📧 ${prefillEmail}`}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab group */}
      <div style={{ margin: '12px 0' }}>
        <div className="tab-group">
          {tabs.map((t) => (
            <button
              key={t.value}
              className={`tab ${activeTab === t.value ? 'tab-active' : ''}`}
              onClick={() => { setActiveTab(t.value); setSendResult(null); }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SMS form */}
      {activeTab === 'sms' && (
        <Card title="Send SMS" padding="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="mcp-field">
              <label className="mcp-field-label">Phone Number <span className="fg-required">*</span></label>
              <input
                type="tel"
                className="mcp-field-input"
                placeholder="Enter phone number..."
                value={smsPhone || prefillPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
              />
            </div>
            <div className="mcp-field">
              <label className="mcp-field-label">Message <span className="fg-required">*</span></label>
              <textarea
                className="mcp-field-input fg-textarea"
                placeholder="Type your message..."
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                rows={4}
              />
              <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>
                {smsBody.length}/160 characters
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Email form */}
      {activeTab === 'email' && (
        <Card title="Send Email" padding="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="mcp-field">
              <label className="mcp-field-label">To <span className="fg-required">*</span></label>
              <input
                type="email"
                className="mcp-field-input"
                placeholder="Enter email address..."
                value={emailTo || prefillEmail}
                onChange={(e) => setEmailTo(e.target.value)}
              />
            </div>
            <div className="mcp-field">
              <label className="mcp-field-label">Subject <span className="fg-required">*</span></label>
              <input
                type="text"
                className="mcp-field-input"
                placeholder="Email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="mcp-field">
              <label className="mcp-field-label">Body <span className="fg-required">*</span></label>
              <textarea
                className="mcp-field-input fg-textarea"
                placeholder="Write your email..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={6}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Send button */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSend}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : `Send ${activeTab === 'sms' ? 'SMS' : 'Email'}`}
        </button>
        {sendResult === 'success' && <span style={{ color: '#059669', fontSize: 13 }}>✓ Sent</span>}
        {sendResult === 'error' && <span style={{ color: '#dc2626', fontSize: 13 }}>✗ Failed</span>}
      </div>
    </div>
  );
}
