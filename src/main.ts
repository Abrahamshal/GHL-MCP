/**
 * GoHighLevel MCP Server
 *
 * Streamable HTTP transport with optional legacy SSE support.
 */

import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

import { mcpAuthRouter, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';

import { EnhancedGHLClient } from './enhanced-ghl-client.js';
import { ToolRegistry } from './tool-registry.js';
import { GHLConfig } from './types/ghl-types.js';
import { registerExecuteRoutes } from './execute-route.js';
import { GhlOAuthProvider } from './oauth-provider.js';
import { AgencyManager } from './agency-client.js';
import { registerAgencyTools } from './tools/agency-tools.js';
import * as path from 'node:path';

dotenv.config();

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, msg: string, data?: Record<string, unknown>) {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;
  const out = level === 'error' ? process.stderr : process.stderr;
  out.write(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...(data || {}) }) + '\n');
}

function readConfig(): GHLConfig {
  const config: GHLConfig = {
    accessToken: process.env.GHL_API_KEY || '',
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2023-02-21',
    locationId: process.env.GHL_LOCATION_ID || '',
  };

  if (!config.accessToken) throw new Error('GHL_API_KEY is required');
  if (!config.locationId) throw new Error('GHL_LOCATION_ID is required');
  return config;
}

function createMcpServer(
  client: EnhancedGHLClient,
  agencyCtx?: { agency: AgencyManager; clientKey: string }
): McpServer {
  const server = new McpServer(
    { name: 'ghl-mcp-server', version: '2.0.0' },
    { capabilities: { tools: {} } }
  );
  new ToolRegistry(client).registerAll(server);
  if (agencyCtx) registerAgencyTools(server, agencyCtx);
  return server;
}

async function main() {
  const port = parseInt(process.env.PORT || process.env.MCP_SERVER_PORT || '8000', 10);

  // Public origin used as the OAuth issuer / resource identifier. On Railway,
  // RAILWAY_PUBLIC_DOMAIN is injected automatically; otherwise set PUBLIC_URL.
  const publicUrl = (
    process.env.PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${port}`)
  ).replace(/\/+$/, '');
  const oauthPassword = process.env.MCP_OAUTH_PASSWORD;
  const authEnabled = !!oauthPassword;
  const mcpResourceUrl = new URL('/mcp', publicUrl);

  // Agency (Company) OAuth mode: one credential, choose any sub-account at runtime.
  // Only the app client id/secret are required; the refresh token is acquired
  // click-through via the install redirect (or seeded from env / the token store).
  const agencyEnabled = !!(
    process.env.GHL_AGENCY_CLIENT_ID &&
    process.env.GHL_AGENCY_CLIENT_SECRET
  );

  const config: GHLConfig = agencyEnabled
    ? {
        accessToken: process.env.GHL_API_KEY || 'agency',
        baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
        version: process.env.GHL_API_VERSION || '2023-02-21',
        locationId: process.env.GHL_DEFAULT_LOCATION_ID || process.env.GHL_LOCATION_ID || '',
      }
    : readConfig();

  let agency: AgencyManager | undefined;
  if (agencyEnabled) {
    agency = new AgencyManager({
      clientId: process.env.GHL_AGENCY_CLIENT_ID as string,
      clientSecret: process.env.GHL_AGENCY_CLIENT_SECRET as string,
      refreshToken: process.env.GHL_AGENCY_REFRESH_TOKEN,
      baseUrl: config.baseUrl,
      version: config.version,
      companyId: process.env.GHL_COMPANY_ID,
      tokenStorePath: process.env.GHL_TOKEN_STORE_PATH || path.join(process.cwd(), '.ghl-agency-token.json'),
    });
  }

  const ghlClient = new EnhancedGHLClient(config);
  const registry = new ToolRegistry(ghlClient);
  const toolCount = registry.getToolCount();
  const startTime = Date.now();

  log('info', 'Initializing GHL MCP server', {
    baseUrl: config.baseUrl,
    version: config.version,
    mode: agencyEnabled ? 'agency' : 'single-location',
    locationId: config.locationId || undefined,
    tools: toolCount,
  });

  if (agencyEnabled && agency) {
    await agency.validate();
    if (agency.isConfigured()) {
      log('info', 'Agency OAuth mode enabled — sub-account selectable at runtime', { companyId: agency.getCompanyId() });
    } else {
      log('warn', 'Agency mode: AWAITING INSTALL — approve the marketplace app install (agency level); the server will complete the connection automatically at its redirect URI.');
    }
  } else {
    await ghlClient.testConnection();
  }

  const ownOrigin = new URL(publicUrl).origin;
  const app = express();
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin) ||
          origin === ownOrigin ||
          origin === 'https://claude.ai' ||
          origin === 'https://claude.com' ||
          origin === 'https://chatgpt.com' ||
          origin === 'https://chat.openai.com') {
        return callback(null, true);
      }
      callback(new Error('CORS not allowed'));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'mcp-session-id', 'x-ghl-access-token', 'x-ghl-location-id'],
    credentials: true,
  }));
  app.use(express.json());
  app.use((req, _res, next) => {
    log('debug', `${req.method} ${req.path}`, { ip: req.ip });
    next();
  });

  // ---- OAuth 2.1 authorization server (optional, enabled by MCP_OAUTH_PASSWORD) ----
  let mcpGuards: express.RequestHandler[] = [];
  if (authEnabled) {
    const provider = new GhlOAuthProvider({ password: oauthPassword as string, resourceName: 'GoHighLevel MCP' });

    // Consent form POST must be registered before the auth router / catch-alls.
    app.post('/oauth/consent', express.urlencoded({ extended: false }), provider.handleConsent);

    // Discovery metadata + /authorize, /token, /register, /revoke endpoints.
    app.use(mcpAuthRouter({
      provider: provider as any,
      issuerUrl: new URL(publicUrl),
      resourceServerUrl: mcpResourceUrl,
      scopesSupported: ['ghl'],
      resourceName: 'GoHighLevel MCP',
    }));

    mcpGuards = [requireBearerAuth({
      verifier: provider,
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpResourceUrl),
    })];
    log('info', 'OAuth enabled: /mcp requires a bearer token', { issuer: publicUrl });
  } else {
    log('warn', 'OAuth DISABLED (no MCP_OAUTH_PASSWORD set) — /mcp is unauthenticated');
  }

  app.all('/mcp', ...mcpGuards, async (req, res) => {
    try {
      const reqAccessToken = req.headers['x-ghl-access-token'] as string | undefined;
      const reqLocationId = req.headers['x-ghl-location-id'] as string | undefined;

      let client: EnhancedGHLClient;
      let agencyCtx: { agency: AgencyManager; clientKey: string } | undefined;

      if (reqAccessToken && reqLocationId) {
        // Explicit per-request credential override (escape hatch).
        client = new EnhancedGHLClient({ ...config, accessToken: reqAccessToken, locationId: reqLocationId });
      } else if (agencyEnabled && agency) {
        if (!agency.isConfigured()) {
          res.status(503).json({ error: 'GHL agency not connected yet. Approve the marketplace app install (agency level) to finish setup.' });
          return;
        }
        // Agency mode: build a client scoped to this connection's active sub-account.
        const clientKey = (req as any).auth?.clientId || 'default';
        const activeLoc = agency.getActiveLocation(clientKey) || config.locationId || '';
        const accessToken = activeLoc ? await agency.getLocationToken(activeLoc) : await agency.getAgencyToken();
        client = new EnhancedGHLClient({ ...config, accessToken, locationId: activeLoc });
        agencyCtx = { agency, clientKey };
      } else {
        client = ghlClient;
      }

      const requestServer = createMcpServer(client, agencyCtx);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await requestServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        requestServer.close().catch(() => {});
      });
    } catch (err: any) {
      log('error', 'Streamable HTTP error', { error: err.message });
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  });

  const handleSSE = async (req: express.Request, res: express.Response) => {
    const sessionId = String(req.query.sessionId || 'unknown');
    log('info', 'SSE connection', { sessionId });

    try {
      const sseServer = createMcpServer(ghlClient);
      const transport = new SSEServerTransport('/sse', res);
      await sseServer.connect(transport);
      req.on('close', () => {
        log('info', 'SSE connection closed', { sessionId });
        sseServer.close().catch(() => {});
      });
    } catch (err: any) {
      log('error', 'SSE error', { error: err.message, sessionId });
      if (!res.headersSent) res.status(500).json({ error: 'Failed to establish SSE connection' });
      else res.end();
    }
  };

  app.get('/sse', handleSSE);
  app.post('/sse', handleSSE);

  app.get('/', async (req, res) => {
    // OAuth install callback: the marketplace app's redirect URI points at "/".
    // HighLevel redirects here with ?code= after the user approves the install;
    // we complete the token exchange server-side — no manual steps.
    const installCode = typeof req.query.code === 'string' ? req.query.code : undefined;
    if (agencyEnabled && agency && installCode) {
      if (agency.isConfigured()) {
        res.status(409).type('html').send('<h1>Already connected</h1><p>This server is already linked to an agency. To re-link, clear the token store and redeploy.</p>');
        return;
      }
      try {
        const info = await agency.installFromCode(installCode, `${publicUrl}/`);
        log('info', 'Agency install completed via redirect', { companyId: info.companyId });
        res.type('html').send('<h1>✅ Agency connected</h1><p>GoHighLevel is now linked to this MCP server. You can close this tab and add the connector in Claude.</p>');
      } catch (err: any) {
        log('error', 'Agency install failed', { error: err.message });
        res.status(400).type('html').send(`<h1>Install failed</h1><p>${err.message}</p><p>Re-open the install link and try again.</p>`);
      }
      return;
    }

    res.json({
      name: 'GoHighLevel MCP Server',
      version: '2.0.0',
      status: 'running',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      endpoints: {
        health: '/health',
        capabilities: '/capabilities',
        tools: '/tools',
        execute: '/execute',
        mcp: '/mcp',
        sse: '/sse',
      },
      tools: registry.getToolCounts(),
      cache: ghlClient.getCacheStats(),
    });
  });

  app.get('/health', (_req, res) => {
    const mem = process.memoryUsage();
    res.json({
      status: 'healthy',
      server: 'ghl-mcp-server',
      version: '2.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      tools: toolCount,
      memory: {
        rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
      },
      cache: ghlClient.getCacheStats(),
    });
  });

  app.get('/capabilities', (_req, res) => {
    res.json({
      capabilities: { tools: {} },
      server: { name: 'ghl-mcp-server', version: '2.0.0' },
      transport: ['streamable-http', 'sse'],
    });
  });

  registerExecuteRoutes(app, registry, config);

  app.get('/tool-inventory', (_req, res) => {
    res.json({
      tools: registry.getToolInventory(),
      count: registry.getToolCount(),
      generatedAt: new Date().toISOString(),
    });
  });

  app.post('/tools/call', async (req, res) => {
    const { name, arguments: args } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Missing tool name' });
      return;
    }

    try {
      const result = await registry.callTool(name, args || {});
      if (result === undefined) {
        res.status(404).json({ error: `Unknown tool: ${name}` });
        return;
      }
      res.json({ result });
    } catch (err: any) {
      log('error', `REST tool error: ${name}`, { error: err.message });
      res.status(500).json({ error: `Tool execution failed: ${err.message}` });
    }
  });

  app.listen(port, '0.0.0.0', () => {
    console.log('GoHighLevel MCP Server v2.0');
    console.log(`Server: http://0.0.0.0:${port}`);
    console.log(`Public URL: ${publicUrl}`);
    console.log(`Streamable HTTP (MCP): ${publicUrl}/mcp`);
    console.log(`Auth: ${authEnabled ? 'OAuth 2.1 (bearer required)' : 'DISABLED'}`);
    console.log(`Mode: ${agencyEnabled ? 'AGENCY (pick sub-account at runtime)' : 'single sub-account'}`);
    console.log(`Tools: ${toolCount}${agencyEnabled ? ' + agency selector tools' : ''}`);
  });

}

process.on('SIGINT', () => { log('info', 'Shutting down (SIGINT)'); process.exit(0); });
process.on('SIGTERM', () => { log('info', 'Shutting down (SIGTERM)'); process.exit(0); });

main().catch((err) => {
  // Put the reason in the message itself so collapsed log viewers show it.
  log('error', `Fatal error: ${err.message}`, { stack: err.stack });
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
});
