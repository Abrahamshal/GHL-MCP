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

import { readFileSync, writeFileSync } from 'node:fs';

const LOCATION_TOKEN_VERSION = '2021-07-28';
const EXPIRY_MARGIN_MS = 60 * 1000; // refresh 60s before actual expiry

export interface AgencyManagerOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
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
  private readonly locationTokens = new Map<string, CachedToken>();
  private readonly activeLocation = new Map<string, string>();
  private readonly subAccountNames = new Map<string, string>();

  constructor(options: AgencyManagerOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.refreshToken = options.refreshToken;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.version = options.version;
    this.companyId = options.companyId;
    this.tokenStorePath = options.tokenStorePath;
    this.loadPersistedRefreshToken();
  }

  getCompanyId(): string | undefined {
    return this.companyId;
  }

  // ---- active-location tracking (keyed by OAuth client id / connector) -------
  getActiveLocation(clientKey: string): string | undefined {
    return this.activeLocation.get(clientKey);
  }

  setActiveLocation(clientKey: string, locationId: string, name?: string): void {
    this.activeLocation.set(clientKey, locationId);
    if (name) this.subAccountNames.set(locationId, name);
  }

  getSubAccountName(locationId: string): string | undefined {
    return this.subAccountNames.get(locationId);
  }

  // ---- agency access token ---------------------------------------------------
  async getAgencyToken(): Promise<string> {
    if (this.agencyToken && Date.now() < this.agencyToken.expiresAtMs - EXPIRY_MARGIN_MS) {
      return this.agencyToken.token;
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

  /** Validate credentials at startup by performing a refresh. */
  async validate(): Promise<void> {
    await this.getAgencyToken();
  }

  // ---- refresh-token persistence --------------------------------------------
  private loadPersistedRefreshToken(): void {
    try {
      const raw = readFileSync(this.tokenStorePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.refresh_token === 'string' && parsed.refresh_token) {
        this.refreshToken = parsed.refresh_token;
      }
    } catch {
      // No persisted token yet — fall back to the env-provided one.
    }
  }

  private persistRefreshToken(): void {
    try {
      writeFileSync(this.tokenStorePath, JSON.stringify({ refresh_token: this.refreshToken }), { mode: 0o600 });
    } catch (err: any) {
      process.stderr.write(`[Agency] Could not persist rotated refresh token: ${err.message}\n`);
    }
  }
}
