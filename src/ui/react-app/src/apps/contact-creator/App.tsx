import React, { useState, useCallback } from 'react';
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

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  tags: string;
  source: string;
}

const INITIAL: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  companyName: '',
  tags: '',
  source: '',
};

const FIELDS: { key: keyof FormValues; label: string; type: string; required?: boolean; placeholder: string }[] = [
  { key: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
  { key: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
  { key: 'companyName', label: 'Company', type: 'text', placeholder: 'Acme Inc.' },
  { key: 'tags', label: 'Tags', type: 'text', placeholder: 'Comma-separated: lead, vip, newsletter' },
  { key: 'source', label: 'Source', type: 'text', placeholder: 'e.g. Website, Referral, Ad Campaign' },
];

export function App() {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | 'queued' | 'error' | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  const { app, isConnected, error } = useApp({
    appInfo: { name: 'Contact Creator', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (a) => {
      a.ontoolresult = async (res) => {
        const parsed = extractData(res);
        if (parsed) setResultData(parsed);
      };
    },
  });

  const setValue = useCallback((key: keyof FormValues, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setResult(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.firstName.trim() || !values.lastName.trim()) return;
    if (!app) return;

    setSubmitting(true);
    setResult(null);

    const args: Record<string, any> = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    };
    if (values.email.trim()) args.email = values.email.trim();
    if (values.phone.trim()) args.phone = values.phone.trim();
    if (values.companyName.trim()) args.companyName = values.companyName.trim();
    if (values.tags.trim()) args.tags = values.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (values.source.trim()) args.source = values.source.trim();

    try {
      await app.updateModelContext({
        content: [{
          type: 'text',
          text: `User wants to create a new contact: ${JSON.stringify(args)}`,
        }],
      });
      setResult('queued');
    } catch {
      setResult('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setValues(INITIAL);
    setResult(null);
    setResultData(null);
  };

  if (error) return <div className="error-state"><h3>Error</h3><p>{error.message}</p></div>;
  if (!isConnected) return <div className="loading-state"><div className="loading-spinner" /><p>Connecting...</p></div>;

  return (
    <PageHeader title="Create Contact" subtitle="Add a new contact to GHL">
      <Card>
        <form onSubmit={handleSubmit} className="form-group">
          {FIELDS.map((f) => (
            <div key={f.key} className="form-field">
              <label className="form-label">
                {f.label}
                {f.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              <input
                type={f.type}
                className="form-input"
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={(e) => setValue(f.key, e.target.value)}
                required={f.required}
              />
            </div>
          ))}

          {result === 'queued' && (
            <div className="save-indicator save-saved" style={{ margin: '8px 0' }}>
              ✅ Contact creation request sent to the model.
              {resultData && <span> ID: {resultData.contact?.id || resultData.id}</span>}
            </div>
          )}
          {result === 'error' && (
            <div className="save-indicator save-error" style={{ margin: '8px 0' }}>
              ❌ Failed to send request. Please try again.
            </div>
          )}

          <div className="action-bar align-right" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-secondary btn-md" onClick={handleReset}>
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-md"
              disabled={submitting || !values.firstName.trim() || !values.lastName.trim()}
            >
              {submitting ? 'Creating…' : 'Create Contact'}
            </button>
          </div>
        </form>
      </Card>
    </PageHeader>
  );
}
