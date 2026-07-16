/**
 * Standalone smoke test for the OAuth layer (no GHL creds required).
 * Mirrors main.ts's auth wiring against a dummy protected route.
 */
import express from 'express';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
// Resolve the SDK + provider via require() so this harness matches the runtime
// module system of the compiled dist (CommonJS) — otherwise instanceof checks
// straddle the SDK's dual ESM/CJS builds and misfire.
const require = createRequire(import.meta.url);
const { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } = require('@modelcontextprotocol/sdk/server/auth/router.js');
const { requireBearerAuth } = require('@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js');
const { GhlOAuthProvider } = require('../dist/oauth-provider.js');

const PORT = 8791;
const PUBLIC_URL = `http://localhost:${PORT}`;
const PASSWORD = 'super-secret-pw';
const mcpResourceUrl = new URL('/mcp', PUBLIC_URL);

const provider = new GhlOAuthProvider({ password: PASSWORD, resourceName: 'GHL MCP Test' });
const app = express();
app.post('/oauth/consent', express.urlencoded({ extended: false }), provider.handleConsent);
app.use(mcpAuthRouter({
  provider,
  issuerUrl: new URL(PUBLIC_URL),
  resourceServerUrl: mcpResourceUrl,
  scopesSupported: ['ghl'],
  resourceName: 'GHL MCP Test',
}));
app.all('/mcp', requireBearerAuth({
  verifier: provider,
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpResourceUrl),
}), (req, res) => res.json({ ok: true, clientId: req.auth?.clientId, scopes: req.auth?.scopes }));

const b64url = (buf) => buf.toString('base64url');
const results = [];
const check = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ->  ' + extra : ''}`); };

const server = app.listen(PORT, async () => {
  try {
    // 1. AS metadata discovery
    const asm = await fetch(`${PUBLIC_URL}/.well-known/oauth-authorization-server`).then(r => r.json());
    check('AS metadata has endpoints', asm.authorization_endpoint && asm.token_endpoint && asm.registration_endpoint, asm.registration_endpoint);

    // 2. Protected Resource Metadata (path-specific per RFC 9728)
    const prm = await fetch(`${PUBLIC_URL}/.well-known/oauth-protected-resource/mcp`).then(r => r.json());
    check('PRM advertises this AS', prm.authorization_servers?.[0] === asm.issuer, prm.resource);

    // 3. /mcp without token -> 401 + WWW-Authenticate w/ resource_metadata
    const noAuth = await fetch(`${PUBLIC_URL}/mcp`, { method: 'POST' });
    check('/mcp unauthenticated -> 401', noAuth.status === 401);
    check('401 carries resource_metadata', /resource_metadata=/.test(noAuth.headers.get('www-authenticate') || ''), noAuth.headers.get('www-authenticate'));

    // 4. Dynamic Client Registration (public client + PKCE)
    const reg = await fetch(`${PUBLIC_URL}/register`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_name: 'Test', redirect_uris: ['https://claude.ai/api/mcp/auth_callback'], token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] }),
    }).then(r => r.json());
    check('DCR returns client_id', !!reg.client_id, reg.client_id);
    const clientId = reg.client_id;
    const redirectUri = reg.redirect_uris[0];

    // 5. PKCE pair
    const verifier = b64url(crypto.randomBytes(32));
    const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
    const state = 'xyz-state';

    // 6. GET /authorize -> consent HTML
    const authUrl = `${PUBLIC_URL}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}&scope=ghl&resource=${encodeURIComponent(mcpResourceUrl.href)}`;
    const consentPage = await fetch(authUrl);
    const consentHtml = await consentPage.text();
    check('/authorize renders consent form', consentPage.status === 200 && consentHtml.includes('name="password"'));

    // 7. Wrong password -> 401, no code
    const wrong = await fetch(`${PUBLIC_URL}/oauth/consent`, {
      method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, code_challenge: challenge, state, scope: 'ghl', resource: mcpResourceUrl.href, password: 'wrong' }),
    });
    check('wrong password rejected', wrong.status === 401);

    // 8. Correct password -> 302 redirect with code
    const consent = await fetch(`${PUBLIC_URL}/oauth/consent`, {
      method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, code_challenge: challenge, state, scope: 'ghl', resource: mcpResourceUrl.href, password: PASSWORD }),
    });
    const loc = consent.headers.get('location') || '';
    const code = new URL(loc).searchParams.get('code');
    const returnedState = new URL(loc).searchParams.get('state');
    check('correct password -> 302 with code', consent.status === 302 && !!code);
    check('state preserved', returnedState === state);

    // 9. Token exchange (authorization_code + PKCE verifier)
    const tok = await fetch(`${PUBLIC_URL}/token`, {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, code_verifier: verifier, client_id: clientId, redirect_uri: redirectUri, resource: mcpResourceUrl.href }),
    }).then(r => r.json());
    check('token endpoint returns access_token', !!tok.access_token && tok.token_type === 'bearer', JSON.stringify(tok).slice(0, 120));

    // 10. Wrong PKCE verifier must fail (fresh code)
    // (re-run consent to get a new code, then exchange with bad verifier)
    const consent2 = await fetch(`${PUBLIC_URL}/oauth/consent`, { method: 'POST', redirect: 'manual', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, code_challenge: challenge, state, scope: 'ghl', resource: mcpResourceUrl.href, password: PASSWORD }) });
    const code2 = new URL(consent2.headers.get('location')).searchParams.get('code');
    const badPkce = await fetch(`${PUBLIC_URL}/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code: code2, code_verifier: b64url(crypto.randomBytes(32)), client_id: clientId, redirect_uri: redirectUri }) });
    check('bad PKCE verifier rejected', badPkce.status >= 400);

    // 11. /mcp WITH token -> 200
    const authed = await fetch(`${PUBLIC_URL}/mcp`, { method: 'POST', headers: { authorization: `Bearer ${tok.access_token}`, 'content-type': 'application/json' }, body: '{}' });
    const authedBody = await authed.json();
    check('/mcp with bearer -> 200', authed.status === 200 && authedBody.ok, JSON.stringify(authedBody));

    // 12. Refresh token grant
    const refreshed = await fetch(`${PUBLIC_URL}/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tok.refresh_token, client_id: clientId }) }).then(r => r.json());
    check('refresh_token grant returns new access_token', !!refreshed.access_token && refreshed.access_token !== tok.access_token);

    // 13. Bogus token rejected
    const bogus = await fetch(`${PUBLIC_URL}/mcp`, { method: 'POST', headers: { authorization: 'Bearer not-a-real-token' } });
    const bogusBody = await bogus.text();
    check('bogus bearer -> 401', bogus.status === 401, `status=${bogus.status} body=${bogusBody.slice(0,160)}`);

  } catch (e) {
    console.error('SMOKE ERROR:', e);
    results.push({ name: 'exception', pass: false });
  } finally {
    server.close();
    const failed = results.filter(r => !r.pass);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    process.exit(failed.length ? 1 : 0);
  }
});
