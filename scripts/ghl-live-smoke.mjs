#!/usr/bin/env node

const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
const apiKey = process.env.GHL_API_KEY;
const locationId = process.env.GHL_LOCATION_ID;
const version = process.env.GHL_API_VERSION || '2023-02-21';
const timeoutMs = Number(process.env.GHL_LIVE_SMOKE_TIMEOUT_MS || 15000);
const runWrites = process.env.GHL_LIVE_WRITE_SMOKE === '1';

if (!apiKey || !locationId) {
  console.log('Skipping live smoke: set GHL_API_KEY and GHL_LOCATION_ID to run read-only GHL checks.');
  process.exit(0);
}

const locationCheck = { name: 'location', method: 'GET', path: `/locations/${encodeURIComponent(locationId)}`, area: 'locations', parseJson: true };

const locationResult = await runCheck(locationCheck);
const locationStatusText = locationResult.status ? `HTTP ${locationResult.status}${locationResult.message ? ` ${locationResult.message}` : ''}` : locationResult.error;
console.log(`${locationResult.ok ? 'ok' : 'fail'} ${locationCheck.name} [${locationCheck.area}; ${locationCheck.method}] ${locationStatusText}`);

let failed = locationResult.ok ? 0 : 1;
const companyId = process.env.GHL_COMPANY_ID || locationResult.data?.location?.companyId || locationResult.data?.companyId;

const readChecks = [
  { name: 'contacts-search', method: 'POST', path: '/contacts/search', area: 'contacts', body: { locationId, pageLimit: 1 } },
  { name: 'users-search', method: 'GET', path: `/users/search?companyId=${encodeURIComponent(companyId || '')}&locationId=${encodeURIComponent(locationId)}&limit=1`, area: 'users' },
  { name: 'email-v2-campaigns', method: 'GET', path: `/emails/public/v2/locations/${encodeURIComponent(locationId)}/campaigns/emails?limit=1`, area: 'emails-v2' },
  { name: 'email-v2-workflow-campaigns', method: 'GET', path: `/emails/public/v2/locations/${encodeURIComponent(locationId)}/campaigns/workflows?limit=1`, area: 'emails-v2' },
  { name: 'email-v2-bulk-action-campaigns', method: 'GET', path: `/emails/public/v2/locations/${encodeURIComponent(locationId)}/campaigns/bulk-actions?limit=1`, area: 'emails-v2' },
  { name: 'email-v2-templates', method: 'GET', path: `/emails/public/v2/locations/${encodeURIComponent(locationId)}/templates?limit=1`, area: 'emails-v2' },
  { name: 'calendars', method: 'GET', path: `/calendars/?locationId=${encodeURIComponent(locationId)}`, area: 'calendars' },
  { name: 'products', method: 'GET', path: `/products/?locationId=${encodeURIComponent(locationId)}&limit=1`, area: 'products' },
  { name: 'opportunities-pipelines', method: 'GET', path: `/opportunities/pipelines?locationId=${encodeURIComponent(locationId)}`, area: 'opportunities' },
];

const writeChecks = [];
if (runWrites) {
  if (process.env.GHL_LIVE_SMOKE_CONTACT_ID) {
    const contactId = encodeURIComponent(process.env.GHL_LIVE_SMOKE_CONTACT_ID);
    writeChecks.push({
      name: 'notes-search-post-read',
      method: 'POST',
      path: '/notes/search',
      area: 'notes',
      body: { locationId, contactId, limit: 1 },
      mutation: false,
    });
  } else {
    console.log('Skipping write smoke additions: set GHL_LIVE_SMOKE_CONTACT_ID with GHL_LIVE_WRITE_SMOKE=1 for safe note search coverage.');
  }
}

const checks = [...readChecks, ...writeChecks];

for (const check of checks) {
  const result = await runCheck(check);
  const statusText = result.status ? `HTTP ${result.status}${result.message ? ` ${result.message}` : ''}` : result.error;
  console.log(`${result.ok ? 'ok' : 'fail'} ${check.name} [${check.area}; ${check.method}] ${statusText}`);
  if (!result.ok) failed += 1;
}

const totalChecks = checks.length + 1;
console.log(`Live smoke complete: ${totalChecks - failed}/${totalChecks} checks passed.`);
if (failed > 0) process.exit(1);

async function runCheck(check) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      method: check.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: version,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: check.body ? JSON.stringify(check.body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      message: summarizeResponseText(text),
      data: check.parseJson && text ? parseJson(text) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function summarizeResponseText(text) {
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    return parsed.message ? `- ${String(parsed.message).slice(0, 160)}` : '';
  } catch {
    return `- ${text.slice(0, 160)}`;
  }
}
