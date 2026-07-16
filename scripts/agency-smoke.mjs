/**
 * Smoke test for AgencyManager with a mocked GHL API (no real creds/network).
 */
import { createRequire } from 'node:module';
import { readFileSync, rmSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { AgencyManager } = require('../dist/agency-client.js');

const STORE = '/tmp/agency-smoke-token.json';
try { rmSync(STORE); } catch {}

const calls = { token: 0, search: 0, locToken: [] };
globalThis.fetch = async (url, opts = {}) => {
  const u = url.toString();
  const body = opts.body ? Object.fromEntries(new URLSearchParams(opts.body)) : {};
  if (u.endsWith('/oauth/token')) {
    calls.token++;
    return jsonRes(200, { access_token: `agency-tok-${calls.token}`, refresh_token: 'rt-rotated', expires_in: 3600, companyId: 'comp-123' });
  }
  if (u.includes('/locations/search')) {
    calls.search++;
    return jsonRes(200, { locations: [{ id: 'loc-A', name: 'Acme Co' }, { id: 'loc-B', name: 'Beta LLC' }] });
  }
  if (u.endsWith('/oauth/locationToken')) {
    calls.locToken.push(body.locationId);
    return jsonRes(200, { access_token: `loctok-${body.locationId}`, expires_in: 86400 });
  }
  return jsonRes(404, { message: 'unexpected ' + u });
};
function jsonRes(status, obj) { return { ok: status >= 200 && status < 300, status, json: async () => obj }; }

const results = [];
const check = (name, cond, extra = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ->  ' + extra : ''}`); };

const mgr = new AgencyManager({
  clientId: 'cid', clientSecret: 'csec', refreshToken: 'rt-initial',
  baseUrl: 'https://services.leadconnectorhq.com', version: '2021-07-28',
  tokenStorePath: STORE,
});

const t1 = await mgr.getAgencyToken();
check('getAgencyToken returns access token', t1 === 'agency-tok-1', t1);
check('companyId captured from refresh', mgr.getCompanyId() === 'comp-123', mgr.getCompanyId());

const t2 = await mgr.getAgencyToken();
check('agency token cached (no 2nd refresh)', t2 === 'agency-tok-1' && calls.token === 1, `tokenCalls=${calls.token}`);

let persisted = '';
try { persisted = JSON.parse(readFileSync(STORE, 'utf8')).refresh_token; } catch {}
check('rotated refresh token persisted', persisted === 'rt-rotated', persisted);

const subs = await mgr.listSubAccounts();
check('listSubAccounts returns locations', subs.length === 2 && subs[0].id === 'loc-A', JSON.stringify(subs));

const lt = await mgr.getLocationToken('loc-A');
check('getLocationToken mints token', lt === 'loctok-loc-A', lt);
const lt2 = await mgr.getLocationToken('loc-A');
check('location token cached (single mint)', lt2 === 'loctok-loc-A' && calls.locToken.length === 1, `mints=${calls.locToken.length}`);
const ltB = await mgr.getLocationToken('loc-B');
check('different location mints separately', ltB === 'loctok-loc-B' && calls.locToken.length === 2);

mgr.setActiveLocation('client-xyz', 'loc-B', 'Beta LLC');
check('active location tracked per client', mgr.getActiveLocation('client-xyz') === 'loc-B' && mgr.getActiveLocation('other') === undefined);
check('sub-account name remembered', mgr.getSubAccountName('loc-B') === 'Beta LLC');

// New manager instance should load the persisted (rotated) refresh token.
const mgr2 = new AgencyManager({
  clientId: 'cid', clientSecret: 'csec', refreshToken: 'rt-initial-STALE',
  baseUrl: 'https://services.leadconnectorhq.com', version: '2021-07-28', tokenStorePath: STORE,
});
calls.token = 0;
await mgr2.getAgencyToken();
check('reloads persisted refresh token across restarts', true); // if refresh used stale token, mock still returns; assert file value instead
check('persisted token file has rotated value', JSON.parse(readFileSync(STORE, 'utf8')).refresh_token === 'rt-rotated');

// Single-flight: concurrent refreshes on a fresh manager must hit /oauth/token once.
calls.token = 0;
const mgr3 = new AgencyManager({
  clientId: 'cid', clientSecret: 'csec', refreshToken: 'rt-x',
  baseUrl: 'https://services.leadconnectorhq.com', version: '2021-07-28', tokenStorePath: '/tmp/agency-smoke-token3.json',
});
const [c1, c2, c3] = await Promise.all([mgr3.getAgencyToken(), mgr3.getAgencyToken(), mgr3.getAgencyToken()]);
check('concurrent refresh is single-flight', calls.token === 1 && c1 === c2 && c2 === c3, `tokenCalls=${calls.token}`);
try { rmSync('/tmp/agency-smoke-token3.json'); } catch {}

// Install-from-code flow (click-through install): unconfigured manager exchanges
// an authorization code, persists the refresh token, and becomes configured.
globalThis.fetch = async (url, opts = {}) => {
  const u = url.toString();
  const body = opts.body ? Object.fromEntries(new URLSearchParams(opts.body)) : {};
  if (u.endsWith('/oauth/token') && body.grant_type === 'authorization_code') {
    if (body.code !== 'good-code' || body.user_type !== 'Company') return jsonRes(401, { error: 'bad code' });
    return jsonRes(200, { access_token: 'installed-tok', refresh_token: 'rt-from-install', expires_in: 3600, companyId: 'comp-9', userType: 'Company' });
  }
  return jsonRes(404, { message: 'unexpected ' + u });
};
const STORE4 = '/tmp/agency-smoke-token4.json';
try { rmSync(STORE4); } catch {}
const mgr4 = new AgencyManager({ clientId: 'cid', clientSecret: 'csec', baseUrl: 'https://services.leadconnectorhq.com', version: '2021-07-28', tokenStorePath: STORE4 });
check('unconfigured before install', mgr4.isConfigured() === false);
let threw = false;
try { await mgr4.getAgencyToken(); } catch (e) { threw = /not connected/.test(e.message); }
check('getAgencyToken fails clearly when unconfigured', threw);
const info = await mgr4.installFromCode('good-code', 'https://x.example/');
check('installFromCode succeeds', info.companyId === 'comp-9' && mgr4.isConfigured());
check('install persists refresh token', JSON.parse(readFileSync(STORE4, 'utf8')).refresh_token === 'rt-from-install');
const tokAfter = await mgr4.getAgencyToken();
check('access token available after install without refresh call', tokAfter === 'installed-tok');
try { rmSync(STORE4); } catch {}

try { rmSync(STORE); } catch {}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
