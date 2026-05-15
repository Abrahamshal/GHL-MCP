#!/usr/bin/env node

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import type { Request, Response } from 'express';
import { createServer } from './server.js';

async function startStdioServer(factory: () => McpServer): Promise<void> {
  await factory().connect(new StdioServerTransport());
}

async function startHttpServer(factory: () => McpServer): Promise<void> {
  const port = parseInt(process.env.GHL_MCP_APPS_PORT || process.env.PORT || '3001', 10);
  const app = createMcpExpressApp({ host: '0.0.0.0' });
  app.use(cors());

  app.all('/mcp', async (req: Request, res: Response) => {
    const server = factory();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[GHL MCP Apps] transport error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      server: 'ghl-mcp-apps',
      transport: 'streamable-http',
      endpoint: '/mcp',
    });
  });

  const httpServer = app.listen(port, '0.0.0.0', () => {
    console.log(`GoHighLevel MCP Apps listening at http://localhost:${port}/mcp`);
  });

  const shutdown = () => {
    httpServer.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function main(): Promise<void> {
  if (process.argv.includes('--stdio')) {
    await startStdioServer(createServer);
    return;
  }
  await startHttpServer(createServer);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
