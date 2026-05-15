# CLI Commands

Use these commands from the repository root. Keep command behavior MCP-focused: build and run the server, refresh tool coverage, and verify the exported tool surface.

## Server Commands

| Command | Use |
| --- | --- |
| `npm run build` | Builds the MCP server into `dist/`. |
| `npm run dev` | Starts the TypeScript entry point with `nodemon` for local iteration. |
| `npm run start:stdio` | Starts the stdio MCP server from `dist/server.js`. Use this for most desktop MCP clients. |
| `npm run start:http` | Starts the HTTP server from `dist/main.js`. Use this for HTTP transports and local `/tools` inspection. |
| `npm run start:legacy` | Starts the older HTTP entry point from `dist/http-server.js` when compatibility testing it. |

## Quality Commands

| Command | Use |
| --- | --- |
| `npm run lint` | Runs the build checker without emitting server output. |
| `npm test` | Runs Jest tests. |
| `npm run test:coverage` | Runs Jest with coverage reporting. |

## Companion CLI Commands

| Command | Use |
| --- | --- |
| `npm run tools:doctor` | Checks Node, build output, local env, and generated API coverage state. |
| `npm run tools:list` | Lists registered MCP tools from the built registry. |
| `npm run tools:report` | Writes `docs/API-DASHBOARD.md` and `docs/tool-inventory.json`. |
| `npm run tools:explorer` | Prints the local static explorer path for browsing `docs/tool-inventory.json`. |
| `npm run tools:configure` | Prints a Claude-compatible stdio MCP config snippet. |
| `npm run tools:update-api` | Runs the official API refresh pipeline. |
| `node scripts/ghl-mcp.mjs test-tool <name> '<json>'` | Executes one tool locally. Write/delete tools require `--confirm`. |

The package also exposes `ghl-mcp` as a bin command after install or publish.

## API Coverage Commands

| Command | Use |
| --- | --- |
| `npm run scan:ghl-api` | Refreshes the upstream GHL docs checkout, regenerates official spec tools, rescans coverage, classifies local-only endpoints, and regenerates the dashboard/inventory. |
| `npm run ci:ghl-api-drift` | Runs the scanner and fails if generated coverage, dashboard, inventory, or generated official tools changed. |
| `node scripts/scan-ghl-api-coverage.mjs --refresh` | Refreshes `tmp/highlevel-api-docs` from `GoHighLevel/highlevel-api-docs` and writes coverage outputs. |
| `node scripts/generate-official-spec-tools.mjs` | Regenerates official fallback MCP tools from `docs/ghl-api-coverage.json`. |

## Live Smoke Command

`npm run smoke:ghl-live` runs read-only GET checks against the configured GHL account. It exits cleanly without credentials, so it can be wired into local preflight without leaking secrets into CI logs.

Required variables:

```sh
GHL_API_KEY=...
GHL_LOCATION_ID=...
```

Optional variables:

```sh
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
```
