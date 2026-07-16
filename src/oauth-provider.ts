/**
 * Self-contained OAuth 2.1 Authorization Server for the GHL MCP server.
 *
 * Implements the MCP SDK's OAuthServerProvider so that MCP clients (e.g. Claude
 * custom connectors) can authenticate via the standard discovery -> dynamic
 * client registration -> authorization-code + PKCE -> bearer token flow.
 *
 * Design notes:
 * - Single tenant. The only human credential is a shared password
 *   (MCP_OAUTH_PASSWORD) entered on the consent screen. Anyone who cannot supply
 *   it cannot obtain a token, and therefore cannot reach /mcp.
 * - State is in-memory. On process restart, issued tokens are invalidated and
 *   clients must re-authorize. Fine for a single Railway instance.
 * - PKCE (S256) is enforced by the SDK's token handler via
 *   challengeForAuthorizationCode(); we only store/return the challenge.
 */

import { Response } from 'express';
import crypto from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { InvalidGrantError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';

// ---- tunables -------------------------------------------------------------
const AUTH_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ACCESS_TOKEN_TTL_SEC = 60 * 60; // 1 hour
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---- helpers --------------------------------------------------------------
function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// Bearer tokens are stored (in memory and on disk) only as SHA-256 hashes, so
// the persisted session file cannot be replayed if it leaks.
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- in-memory stores -----------------------------------------------------
interface StoredClient {
  client_id: string;
  redirect_uris: string[];
  [key: string]: unknown;
}

interface StoredAuthCode {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource?: string;
  expiresAt: number;
}

interface StoredAccessToken {
  clientId: string;
  scopes: string[];
  resource?: string;
  expiresAtSec: number;
}

interface StoredRefreshToken {
  clientId: string;
  scopes: string[];
  resource?: string;
  expiresAtMs: number;
}

class InMemoryClientsStore {
  private clients = new Map<string, StoredClient>();
  onChange?: () => void;

  getClient(clientId: string): StoredClient | undefined {
    return this.clients.get(clientId);
  }

  // Dynamic Client Registration. The SDK register handler has already assigned
  // client_id / client_secret; we simply persist and echo the record back.
  registerClient(client: StoredClient): StoredClient {
    this.clients.set(client.client_id, client);
    this.onChange?.();
    return client;
  }

  entries(): StoredClient[] {
    return [...this.clients.values()];
  }

  restore(clients: StoredClient[]): void {
    for (const c of clients) {
      if (c && typeof c.client_id === 'string') this.clients.set(c.client_id, c);
    }
  }
}

export interface GhlOAuthProviderOptions {
  password: string;
  resourceName?: string;
  /** Persist clients + token hashes here so connector sessions survive restarts. */
  storePath?: string;
}

export class GhlOAuthProvider {
  public readonly clientsStore = new InMemoryClientsStore();
  private readonly password: string;
  private readonly resourceName: string;
  private readonly storePath?: string;
  private readonly authCodes = new Map<string, StoredAuthCode>();
  // Keyed by sha256(token), never the raw token.
  private readonly accessTokens = new Map<string, StoredAccessToken>();
  private readonly refreshTokens = new Map<string, StoredRefreshToken>();

  constructor(options: GhlOAuthProviderOptions) {
    if (!options.password || options.password.length < 8) {
      throw new Error('MCP_OAUTH_PASSWORD must be set and at least 8 characters');
    }
    this.password = options.password;
    this.resourceName = options.resourceName || 'GoHighLevel MCP';
    this.storePath = options.storePath;
    this.loadStore();
    this.clientsStore.onChange = () => this.persistStore();
  }

  // ---- session persistence (survives restarts/redeploys) --------------------
  private loadStore(): void {
    if (!this.storePath) return;
    try {
      const raw = JSON.parse(readFileSync(this.storePath, 'utf8'));
      const nowSec = Math.floor(Date.now() / 1000);
      this.clientsStore.restore(Array.isArray(raw.clients) ? raw.clients : []);
      for (const [hash, entry] of Object.entries<any>(raw.accessTokens || {})) {
        if (entry && entry.expiresAtSec > nowSec) this.accessTokens.set(hash, entry);
      }
      for (const [hash, entry] of Object.entries<any>(raw.refreshTokens || {})) {
        if (entry && entry.expiresAtMs > Date.now()) this.refreshTokens.set(hash, entry);
      }
    } catch {
      // No store yet (first boot) or unreadable — start empty.
    }
  }

  private persistStore(): void {
    if (!this.storePath) return;
    try {
      mkdirSync(dirname(this.storePath), { recursive: true });
      writeFileSync(
        this.storePath,
        JSON.stringify({
          v: 1,
          clients: this.clientsStore.entries(),
          accessTokens: Object.fromEntries(this.accessTokens),
          refreshTokens: Object.fromEntries(this.refreshTokens),
        }),
        { mode: 0o600 }
      );
    } catch (err: any) {
      process.stderr.write(`[OAuth] Could not persist session store: ${err.message}\n`);
    }
  }

  // Called by the SDK authorize handler after it has validated client_id,
  // redirect_uri and the PKCE challenge. Instead of auto-approving, we render a
  // password-gated consent page that posts back to /oauth/consent.
  async authorize(
    client: StoredClient,
    params: {
      state?: string;
      scopes?: string[];
      codeChallenge: string;
      redirectUri: string;
      resource?: URL;
    },
    res: Response
  ): Promise<void> {
    res.status(200).type('html').send(
      this.renderConsentPage({
        clientId: client.client_id,
        redirectUri: params.redirectUri,
        codeChallenge: params.codeChallenge,
        state: params.state ?? '',
        scope: (params.scopes ?? []).join(' '),
        resource: params.resource?.href ?? '',
        error: '',
      })
    );
  }

  // Handles the POST from the consent form. Validates the password, then mints a
  // one-time authorization code bound to the client + PKCE challenge.
  handleConsent = (req: any, res: Response): void => {
    const body = req.body || {};
    const clientId = String(body.client_id || '');
    const redirectUri = String(body.redirect_uri || '');
    const codeChallenge = String(body.code_challenge || '');
    const state = String(body.state || '');
    const scope = String(body.scope || '');
    const resource = String(body.resource || '');
    const password = String(body.password || '');

    const client = this.clientsStore.getClient(clientId);
    // Re-validate the client and redirect target to prevent open-redirect / code
    // injection via a forged consent POST.
    if (!client || !client.redirect_uris.includes(redirectUri)) {
      res.status(400).type('html').send('<h1>Invalid authorization request</h1>');
      return;
    }

    if (!timingSafeEqualStr(password, this.password)) {
      res.status(401).type('html').send(
        this.renderConsentPage({
          clientId,
          redirectUri,
          codeChallenge,
          state,
          scope,
          resource,
          error: 'Incorrect password. Try again.',
        })
      );
      return;
    }

    const code = randomToken(32);
    this.authCodes.set(code, {
      clientId,
      redirectUri,
      codeChallenge,
      scopes: scope ? scope.split(' ').filter(Boolean) : [],
      resource: resource || undefined,
      expiresAt: Date.now() + AUTH_CODE_TTL_MS,
    });

    const target = new URL(redirectUri);
    target.searchParams.set('code', code);
    if (state) target.searchParams.set('state', state);
    res.redirect(302, target.href);
  };

  async challengeForAuthorizationCode(client: StoredClient, authorizationCode: string): Promise<string> {
    const entry = this.authCodes.get(authorizationCode);
    if (!entry || entry.clientId !== client.client_id) {
      throw new InvalidGrantError('Invalid authorization code');
    }
    if (entry.expiresAt < Date.now()) {
      this.authCodes.delete(authorizationCode);
      throw new InvalidGrantError('Authorization code expired');
    }
    return entry.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: StoredClient,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string
  ): Promise<Record<string, unknown>> {
    const entry = this.authCodes.get(authorizationCode);
    if (!entry || entry.clientId !== client.client_id) {
      throw new InvalidGrantError('Invalid authorization code');
    }
    // One-time use.
    this.authCodes.delete(authorizationCode);
    if (entry.expiresAt < Date.now()) {
      throw new InvalidGrantError('Authorization code expired');
    }
    if (redirectUri !== undefined && redirectUri !== entry.redirectUri) {
      throw new InvalidGrantError('redirect_uri mismatch');
    }
    return this.issueTokens(client.client_id, entry.scopes, entry.resource);
  }

  async exchangeRefreshToken(
    client: StoredClient,
    refreshToken: string,
    scopes?: string[]
  ): Promise<Record<string, unknown>> {
    const refreshHash = hashToken(refreshToken);
    const entry = this.refreshTokens.get(refreshHash);
    if (!entry || entry.clientId !== client.client_id) {
      throw new InvalidGrantError('Invalid refresh token');
    }
    if (entry.expiresAtMs < Date.now()) {
      this.refreshTokens.delete(refreshHash);
      this.persistStore();
      throw new InvalidGrantError('Refresh token expired');
    }
    // Rotate the refresh token.
    this.refreshTokens.delete(refreshHash);
    const grantedScopes = scopes && scopes.length ? scopes : entry.scopes;
    return this.issueTokens(client.client_id, grantedScopes, entry.resource);
  }

  async verifyAccessToken(token: string): Promise<{
    token: string;
    clientId: string;
    scopes: string[];
    expiresAt: number;
    resource?: URL;
  }> {
    const tokenHash = hashToken(token);
    const entry = this.accessTokens.get(tokenHash);
    if (!entry) {
      throw new InvalidTokenError('Invalid access token');
    }
    if (entry.expiresAtSec < Math.floor(Date.now() / 1000)) {
      this.accessTokens.delete(tokenHash);
      this.persistStore();
      throw new InvalidTokenError('Access token expired');
    }
    return {
      token,
      clientId: entry.clientId,
      scopes: entry.scopes,
      expiresAt: entry.expiresAtSec,
      resource: entry.resource ? new URL(entry.resource) : undefined,
    };
  }

  async revokeToken(_client: StoredClient, request: { token: string }): Promise<void> {
    const tokenHash = hashToken(request.token);
    this.accessTokens.delete(tokenHash);
    this.refreshTokens.delete(tokenHash);
    this.persistStore();
  }

  private issueTokens(clientId: string, scopes: string[], resource?: string): Record<string, unknown> {
    const accessToken = randomToken(32);
    const refreshToken = randomToken(32);
    const expiresAtSec = Math.floor(Date.now() / 1000) + ACCESS_TOKEN_TTL_SEC;

    this.accessTokens.set(hashToken(accessToken), { clientId, scopes, resource, expiresAtSec });
    this.refreshTokens.set(hashToken(refreshToken), {
      clientId,
      scopes,
      resource,
      expiresAtMs: Date.now() + REFRESH_TOKEN_TTL_MS,
    });
    this.persistStore();

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: ACCESS_TOKEN_TTL_SEC,
      refresh_token: refreshToken,
      scope: scopes.join(' ') || undefined,
    };
  }

  private renderConsentPage(fields: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string;
    scope: string;
    resource: string;
    error: string;
  }): string {
    const hidden = (name: string, value: string) =>
      `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`;
    const errorBlock = fields.error
      ? `<p class="error">${escapeHtml(fields.error)}</p>`
      : '';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Authorize ${escapeHtml(this.resourceName)}</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0;
    min-height: 100vh; display: grid; place-items: center; background: #0b0c10; color: #e8e8ea; }
  .card { width: min(92vw, 400px); background: #16181d; border: 1px solid #262a33;
    border-radius: 14px; padding: 28px; box-shadow: 0 10px 40px rgba(0,0,0,.4); }
  h1 { font-size: 1.15rem; margin: 0 0 4px; }
  p.sub { margin: 0 0 20px; color: #9aa0aa; font-size: .9rem; }
  label { display: block; font-size: .85rem; margin-bottom: 6px; color: #c3c7cf; }
  input[type=password] { width: 100%; box-sizing: border-box; padding: 11px 12px;
    border-radius: 9px; border: 1px solid #333844; background: #0e1014; color: #fff;
    font-size: 1rem; }
  button { margin-top: 18px; width: 100%; padding: 11px; border: 0; border-radius: 9px;
    background: #4f7cff; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer; }
  button:hover { background: #6a8dff; }
  .error { background: #3a1720; border: 1px solid #5b2230; color: #ff9db0;
    padding: 9px 12px; border-radius: 8px; font-size: .85rem; margin: 0 0 16px; }
  .foot { margin-top: 16px; font-size: .75rem; color: #6b7280; text-align: center; }
</style>
</head>
<body>
  <form class="card" method="post" action="/oauth/consent" autocomplete="off">
    <h1>Authorize ${escapeHtml(this.resourceName)}</h1>
    <p class="sub">A client is requesting access to your GoHighLevel MCP server. Enter the access password to approve.</p>
    ${errorBlock}
    <label for="password">Access password</label>
    <input id="password" type="password" name="password" autofocus required />
    ${hidden('client_id', fields.clientId)}
    ${hidden('redirect_uri', fields.redirectUri)}
    ${hidden('code_challenge', fields.codeChallenge)}
    ${hidden('state', fields.state)}
    ${hidden('scope', fields.scope)}
    ${hidden('resource', fields.resource)}
    <button type="submit">Approve access</button>
    <p class="foot">Client ID: ${escapeHtml(fields.clientId)}</p>
  </form>
</body>
</html>`;
  }
}
