/**
 * Agency (Company) OAuth manager for multi-sub-account access.
 *
 * Model: an agency-distribution Marketplace app is installed on the agency,
 * giving a Company-level refresh token. We:
 *   - refresh the agency access token on demand (POST /oauth/token),
 *   - list the agency's sub-accounts (GET /locations/search?companyId=...),
 *   - mint short-lived per-location access tokens (POST /oauth/locationToken),
 *   - remember which sub-account each connected client is "working in".
 *
 * HighLevel gates the location-token exchange to agency OAuth apps (not PITs),
 * which is why this path uses client_id/client_secret + refresh_token rather
 * than a Private Integration Token.
 *
 * Refresh tokens ROTATE on each use, so the latest one is persisted to
 * GHL_TOKEN_STORE_PATH (mount a Railway volume there to survive restarts;
 * otherwise a redeploy requires re-pasting GHL_AGENCY_REFRESH_TOKEN).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const LOCATION_TOKEN_VERSION = '2021-07-28';
const EXPIRY_MARGIN_MS = 60 * 1000; // refresh 60s before actual expiry

export interface AgencyManagerOptions {
  clientId: string;
  clientSecret: string;
  /** Optional seed; normally acquired via installFromCode() and persisted. */
  refreshToken?: string;
  baseUrl: string;
  version: string;
  companyId?: string;
  tokenStorePath: string;
}

export interface SubAccount {
  id: string;
  name: string;
}

interface CachedToken {
  token: string;
  expiresAtMs: number;
}

export class AgencyManager {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private readonly version: string;
  private readonly tokenStorePath: string;

  private refreshToken: string;
  private companyId?: string;
  private agencyToken?: CachedToken;
  private refreshInFlight?: Promise<string>;
  private readonly locationTokens = new Map<string, CachedToken>();
  private readonly activeLocation = new Map<string, string>();
  private readonly subAccountNames = new Map<string, string>();

  constructor(options: AgencyManagerOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.refreshToken = options.refreshToken || '';
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.version = options.version;
    this.companyId = options.companyId;
    this.tokenStorePath = options.tokenStorePath;
    this.loadPersistedRefreshToken();
  }

  getCompanyId(): string | undefined {
    return this.companyId;
  }

  /** True once a refresh token exists (via env seed, persisted store, or install). */
  isConfigured(): boolean {
    return !!this.refreshToken;
  }

  /**
   * Complete an OAuth install: exchange an authorization code for Company
   * tokens and persist the refresh token. Called by the server's redirect
   * handler so the whole install is click-through — no manual token handling.
   */
  async installFromCode(code: string, redirectUri: string): Promise<{ companyId?: string; userType?: string }> {
    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code,
        user_type: 'Company',
        redirect_uri: redirectUri,
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token || !data.refresh_token) {
      throw new Error(`Install token exchange failed (${res.status}): ${data.error_description || data.message || data.error || 'unknown error'}`);
    }
    if (data.userType && data.userType !== 'Company') {
      throw new Error(`Install returned a ${data.userType}-level token. Re-run the install and choose the Agency (Company) level.`);
    }
    // Pin to the configured company if one was specified.
    if (this.companyId && data.companyId && data.companyId !== this.companyId) {
      throw new Error('Install is for a different agency (companyId mismatch); rejected.');
    }
    this.agencyToken = { token: data.access_token, expiresAtMs: Date.now() + (data.expires_in ?? 3600) * 1000 };
    if (data.companyId) this.companyId = data.companyId;
    this.refreshToken = data.refresh_token;
    this.persistRefreshToken();
    return { companyId: data.companyId, userType: data.userType };
  }

  // ---- active-location tracking (keyed by OAuth client id / connector) -------
  getActiveLocation(clientKey: string): string | undefined {
    return this.activeLocation.get(clientKey);
  }

  setActiveLocation(clientKey: string, locationId: string, name?: string): void {
    this.activeLocation.set(clientKey, locationId);
    if (name) this.subAccountNames.set(locationId, name);
    this.persistState();
  }

  getSubAccountName(locationId: string): string | undefined {
    return this.subAccountNames.get(locationId);
  }

  // ---- agency access token ---------------------------------------------------
  async getAgencyToken(): Promise<string> {
    if (this.agencyToken && Date.now() < this.agencyToken.expiresAtMs - EXPIRY_MARGIN_MS) {
      return this.agencyToken.token;
    }
    // Single-flight: the refresh token rotates on use, so concurrent refreshes
    // would double-spend it and one would fail. Share one in-flight request.
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.doRefresh().finally(() => {
        this.refreshInFlight = undefined;
      });
    }
    return this.refreshInFlight;
  }

  private async doRefresh(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('GHL agency not connected yet. Open the app install link to connect this server to your agency.');
    }
    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        user_type: 'Company',
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(`Agency token refresh failed (${res.status}): ${data.message || data.error || 'unknown error'}`);
    }
    this.agencyToken = { token: data.access_token, expiresAtMs: Date.now() + (data.expires_in ?? 3600) * 1000 };
    if (data.companyId) this.companyId = data.companyId;
    // Refresh tokens rotate — persist the new one.
    if (data.refresh_token && data.refresh_token !== this.refreshToken) {
      this.refreshToken = data.refresh_token;
      this.persistRefreshToken();
    }
    return this.agencyToken.token;
  }

  // ---- sub-account discovery -------------------------------------------------
  async listSubAccounts(opts: { limit?: number; search?: string } = {}): Promise<SubAccount[]> {
    const token = await this.getAgencyToken();
    if (!this.companyId) throw new Error('companyId is not known yet; agency token did not return one');
    const url = new URL(`${this.baseUrl}/locations/search`);
    url.searchParams.set('companyId', this.companyId);
    url.searchParams.set('limit', String(opts.limit ?? 100));
    if (opts.search) url.searchParams.set('searchQuery', opts.search);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Version: this.version, Accept: 'application/json' },
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`List sub-accounts failed (${res.status}): ${data.message || data.error || 'unknown error'}`);
    }
    const locations: any[] = data.locations || data.data || [];
    const list = locations.map((l) => ({ id: String(l.id || l._id), name: String(l.name || l.businessName || l.id) }));
    for (const s of list) this.subAccountNames.set(s.id, s.name);
    return list;
  }

  // ---- per-location access token --------------------------------------------
  async getLocationToken(locationId: string): Promise<string> {
    const cached = this.locationTokens.get(locationId);
    if (cached && Date.now() < cached.expiresAtMs - EXPIRY_MARGIN_MS) {
      return cached.token;
    }
    const agencyToken = await this.getAgencyToken();
    if (!this.companyId) throw new Error('companyId is not known yet; cannot mint a location token');
    const res = await fetch(`${this.baseUrl}/oauth/locationToken`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${agencyToken}`,
        Version: LOCATION_TOKEN_VERSION,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({ companyId: this.companyId, locationId }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(`Location token mint failed for ${locationId} (${res.status}): ${data.message || data.error || 'unknown error'}`);
    }
    const entry: CachedToken = { token: data.access_token, expiresAtMs: Date.now() + (data.expires_in ?? 86400) * 1000 };
    this.locationTokens.set(locationId, entry);
    return entry.token;
  }

  /** Validate credentials at startup by performing a refresh (no-op until installed). */
  async validate(): Promise<void> {
    if (!this.isConfigured()) return;
    await this.getAgencyToken();
  }

  // ---- state persistence (refresh token + active sub-account selections) ----
  private loadPersistedRefreshToken(): void {
    try {
      const raw = readFileSync(this.tokenStorePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.refresh_token === 'string' && parsed.refresh_token) {
        this.refreshToken = parsed.refresh_token;
      }
      for (const [k, v] of Object.entries<any>(parsed?.activeLocations || {})) {
        if (typeof v === 'string') this.activeLocation.set(k, v);
      }
      for (const [k, v] of Object.entries<any>(parsed?.subAccountNames || {})) {
        if (typeof v === 'string') this.subAccountNames.set(k, v);
      }
    } catch {
      // No persisted state yet — fall back to the env-provided token.
    }
  }

  private persistRefreshToken(): void {
    this.persistState();
  }

  private persistState(): void {
    try {
      mkdirSync(dirname(this.tokenStorePath), { recursive: true });
      writeFileSync(
        this.tokenStorePath,
        JSON.stringify({
          refresh_token: this.refreshToken,
          activeLocations: Object.fromEntries(this.activeLocation),
          subAccountNames: Object.fromEntries(this.subAccountNames),
        }),
        { mode: 0o600 }
      );
    } catch (err: any) {
      process.stderr.write(`[Agency] Could not persist state: ${err.message}\n`);
    }
  }
}
