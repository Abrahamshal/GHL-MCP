# GoHighLevel MCP Server

Model Context Protocol server for GoHighLevel. It exposes GHL API operations as MCP tools over stdio, Streamable HTTP, legacy SSE, and optional MCP Apps.

New here? Start with [QUICKSTART.md](QUICKSTART.md).

Using an AI/dev agent? Give it [AGENT_SETUP.md](AGENT_SETUP.md) and say: "Set this up for my MCP client using the curated profile. Ask me for credentials if needed. Do not run write tools."

## 5-Minute Quickstart

Requirements:

- Node 20+
- A GoHighLevel private integration token or OAuth access token
- A GoHighLevel Location ID

```bash
npm install
cp .env.example .env
npm run build
npm run doctor
npm run configure:codex
```

Add your credentials to `.env`:

```bash
GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2023-02-21
```

`GHL_API_VERSION=2023-02-21` is the current HighLevel API `Version` header used by official docs. It is not the project year, and it should not be changed to 2026 unless HighLevel publishes a new required API version.

Then verify live auth:

```bash
npm run auth-check
```

## Setup Commands

```bash
npm run setup                 # Create .env if needed, build, and print next steps
npm run doctor                # Human-readable setup check
npm run doctor -- --json      # Agent-readable setup check
npm run agent:check           # Safe validation for AI/dev agents
npm run auth-check            # Read-only GHL token/location check
```

Missing credentials are reported as `needsHumanAction`, not as a broken install. This lets agents build and configure the repo without inventing secrets.

## MCP Client Config

Beginner configs use `GHL_TOOL_PROFILE=curated` so agents see the high-level workflow tools first.

```bash
npm run configure:codex
npm run configure:claude
npm run configure:cursor
npm run configure:windsurf
```

Advanced examples:

```bash
node scripts/ghl-mcp.mjs configure codex --profile stable
node scripts/ghl-mcp.mjs configure codex --profile full
node scripts/ghl-mcp.mjs configure codex --profile curated --json
```

## Tool Profiles

- `curated` - recommended for agents; high-level CRM workflows with confirmation queues.
- `stable` - production-friendly; official, supplemental, curated, and legacy-compatible tools.
- `full` - everything.
- `official` - official OpenAPI and live-docs supplemental tools.
- `raw` - endpoint-level tools only.

## Run

```bash
npm run start:stdio       # Desktop MCP clients
npm run start:http        # Streamable HTTP at /mcp
npm run start:legacy      # Legacy SSE at /sse
```

HTTP also exposes:

- `GET /health`
- `GET /capabilities`
- `GET /tools`
- `POST /execute`
- `POST /tools/call`

## MCP Apps

```bash
npm run apps:setup
npm run apps:preview
```

Open `http://localhost:3001/preview`. Without GHL credentials, the apps use preview/demo states and tell you exactly which env vars are missing.

## Tool Discovery

```bash
npm run tools:list
npm run tools:list -- --search contacts
npm run tools:list -- --category contacts
npm run tools:list -- --stability official
npm run tools:list -- --access write
npm run tools:list -- --destructive
npm run tools:explorer
```

The static explorer is `docs/tool-explorer.html`.

## Docs

- [Update Log](UPDATE_LOG.md)
- [Setup](docs/SETUP.md)
- [Usage](docs/USAGE.md)
- [Clients](docs/CLIENTS.md)
- [Tool Profiles](docs/TOOL-PROFILES.md)
- [Recipes](docs/RECIPES.md)
- [Safety](docs/SAFETY.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Development](docs/DEVELOPMENT.md)
- [API Coverage](docs/API-COVERAGE.md)
- [Companion Tooling](docs/TOOLING.md)

## Update History

| Date | Update # | Included |
| --- | ---: | --- |
| 2026-06-11 | 1 | Onboarding and agent setup overhaul. See [UPDATE_LOG.md](UPDATE_LOG.md) for the full permanent update description. |

## API Coverage

- Official GHL endpoints parsed: `590`
- Official endpoint coverage: `590 / 590`
- Generated official endpoint tools: `238`
- MCP tools in registry: `848`
- Local-only endpoint references tracked for review: `253`

Generated coverage artifacts live in `docs/`. Run `npm run scan:ghl-api` only when intentionally refreshing API coverage.

## Safety

- `.env` is ignored and must never be committed.
- `test-tool` refuses write/destructive tools unless `--confirm` is supplied.
- Curated workflow tools stage confirmation queues for writes.
- Use `curated` for beginners and `stable` for production.
