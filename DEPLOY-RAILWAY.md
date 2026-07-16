# Deploy to Railway as a Claude custom connector (OAuth-secured)

This fork adds a self-contained **OAuth 2.1 authorization server** in front of the
Streamable HTTP `/mcp` endpoint so it can be exposed publicly and added to
claude.ai as a **custom connector**. Auth turns on automatically when
`MCP_OAUTH_PASSWORD` is set.

## What was added
- `src/oauth-provider.ts` — in-memory OAuth 2.1 provider (DCR, authorization-code
  + PKCE, refresh tokens, bearer verification) with a password-gated consent page.
- `src/main.ts` — mounts the OAuth discovery/authorize/token/register endpoints,
  a `/oauth/consent` route, and protects `/mcp` with `requireBearerAuth`. CORS now
  also allows the server's own origin and `claude.ai` / `claude.com`.
- `railway.json` — Dockerfile build + `/health` healthcheck.
- `scripts/oauth-smoke.mjs` — standalone test of the full OAuth handshake
  (`node scripts/oauth-smoke.mjs`, no GHL creds required).

## 1. Push this repo to your own GitHub
Railway deploys from a repo you own. Create a new GitHub repo and push this folder,
or fork the original and apply these changes.

## 2. Create the Railway service
1. Railway → **New Project → Deploy from GitHub repo** → pick your repo.
2. Railway auto-detects the `Dockerfile` (Node 22). No build config needed.
3. Under the service → **Settings → Networking → Generate Domain**. This gives you
   `https://<something>.up.railway.app` and sets `RAILWAY_PUBLIC_DOMAIN`
   automatically (the server uses it as the OAuth issuer).

## 3. Set environment variables (Railway → Variables)
| Variable | Value |
|---|---|
| `GHL_API_KEY` | Your GoHighLevel private-integration token |
| `GHL_LOCATION_ID` | Your sub-account Location ID |
| `MCP_OAUTH_PASSWORD` | A long random secret (this gates the consent screen) |
| `GHL_TOOL_PROFILE` | `curated` (recommended) or `stable` |
| `GHL_BASE_URL` | `https://services.leadconnectorhq.com` (optional) |
| `GHL_API_VERSION` | `2023-02-21` (optional) |

Notes:
- **Do not** set `PORT` — Railway injects it; the server reads it.
- Only set `PUBLIC_URL` if you attach a **custom domain**
  (e.g. `PUBLIC_URL=https://ghl.yourdomain.com`). Otherwise leave it blank and the
  Railway domain is used.
- The server validates the GHL key at startup — if the key is wrong the deploy
  fails its healthcheck. Check **Deploy logs** for `Invalid JWT`.

## 4. Verify the deployment
From your machine (replace the domain):
```
curl https://<your>.up.railway.app/health
curl https://<your>.up.railway.app/.well-known/oauth-authorization-server
curl -i -X POST https://<your>.up.railway.app/mcp   # expect: 401 + WWW-Authenticate
```
The 401 with a `WWW-Authenticate: Bearer ... resource_metadata=...` header is what
tells Claude to start the OAuth flow.

## 5. Add it to Claude
1. claude.ai → **Settings → Connectors → Add custom connector**.
2. Name it, and set the URL to **`https://<your>.up.railway.app/mcp`**.
3. Leave OAuth Client ID/Secret blank — the server supports **Dynamic Client
   Registration**, so Claude registers itself.
4. Click **Connect**. Claude opens the consent page → enter your
   `MCP_OAUTH_PASSWORD` → **Approve access**.
5. The tools appear. With `GHL_TOOL_PROFILE=curated`, write actions are staged in
   confirmation queues.

## Agency mode (choose any sub-account at runtime)

Instead of pinning the server to one sub-account, you can run it in **Agency
(Company) OAuth mode**: one agency credential, and you pick which sub-account to
work in from inside Claude.

### How it works
- The server holds a Company-level OAuth refresh token, mints a short-lived
  **location access token** per sub-account on demand (`POST /oauth/locationToken`),
  and remembers which sub-account each connection is working in.
- Three extra tools appear:
  - `ghl_list_subaccounts` — list every sub-account under the agency.
  - `ghl_select_subaccount` — switch the active sub-account (by `locationId` or name).
  - `ghl_current_subaccount` — show the active one.
- Every other tool then runs against the selected sub-account.

> Note: this requires an **agency-distribution Marketplace app**, not a Private
> Integration Token — HighLevel restricts the location-token exchange to OAuth
> agency apps. ([HighLevel docs](https://marketplace.gohighlevel.com/docs/ghl/oauth/get-location-access-token/index.html))

### One-time setup
1. HighLevel **Settings → API / Marketplace** → create a Marketplace app, set its
   distribution type to **Agency**, and add the scopes you need
   (`locations.readonly`, `oauth.write`, plus contacts/conversations/opportunities/etc.).
2. Set the redirect URI and run the OAuth install **on your agency (Company)**.
   Capture the `client_id`, `client_secret`, and the **Company `refresh_token`**
   returned by the token exchange. (HighLevel's OAuth helper at
   https://www.ghlapiv2.com/ can walk you through the install.)
3. In Railway → **Variables**, set:
   | Variable | Value |
   |---|---|
   | `GHL_AGENCY_CLIENT_ID` | app client id |
   | `GHL_AGENCY_CLIENT_SECRET` | app client secret |
   | `GHL_AGENCY_REFRESH_TOKEN` | Company refresh token from the install |
   | `MCP_OAUTH_PASSWORD` | (still required — secures the connector) |
   | `GHL_TOKEN_STORE_PATH` | `/data/ghl-token.json` (see volume note) |
   | `GHL_TOOL_PROFILE` | `curated` or `stable` |

   You can leave `GHL_API_KEY` / `GHL_LOCATION_ID` unset in this mode.
4. **Refresh-token persistence (Railway Volume).** HighLevel rotates the refresh
   token on every refresh, so the newest one must outlive redeploys. Railway's
   normal filesystem is wiped on each deploy — a Volume is not. Set it up once:
   1. Service → **Settings → Volumes → + New Volume**.
   2. Set **Mount path** to `/data`.
   3. In **Variables**, set `GHL_TOKEN_STORE_PATH=/data/ghl-token.json`.

   That's it — the server writes the rotated token to `/data/ghl-token.json` and
   reads it on startup, so you never touch `GHL_AGENCY_REFRESH_TOKEN` again after
   the first deploy. (The file is created automatically on the first refresh; the
   parent dir is created if needed.)

   Notes:
   - A Railway Volume attaches to a single service and forces single-instance
     deploys — correct here, since token state is per-instance anyway.
   - The volume holds a live secret; it inherits the service's access controls.
     `.ghl-agency-token.json` / `*.ghl-token.json` are gitignored so it never lands
     in the repo.

### Using it in Claude
After connecting, just ask: *"list my GHL sub-accounts"* → *"work in Acme Co"* →
then use any tool. Say *"switch to Beta LLC"* to change accounts.

## Security model
- `/mcp` is unreachable without a valid bearer token; tokens are only issued after
  the `MCP_OAUTH_PASSWORD` consent step, and every token exchange is PKCE-bound.
- Access tokens live 1h; refresh tokens 30 days. Tokens/clients are in-memory, so a
  Railway restart or redeploy forces a one-time re-authorization in Claude.
- Rotate access by changing `MCP_OAUTH_PASSWORD` (invalidates future logins) and
  redeploying (drops existing tokens).
- The GHL API key lives only in Railway env vars, never in the connector config.

## Local testing
```
npm install
npm run build
node scripts/oauth-smoke.mjs        # 14/14 checks, no GHL creds needed
# full server (needs real GHL creds):
GHL_API_KEY=... GHL_LOCATION_ID=... MCP_OAUTH_PASSWORD=... PUBLIC_URL=http://localhost:8000 npm run start:http
```
