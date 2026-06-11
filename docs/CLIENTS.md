# MCP Clients

Generate config from the repo root.

```bash
npm run configure:codex
npm run configure:claude
npm run configure:cursor
npm run configure:windsurf
```

All beginner configs include:

```json
"GHL_TOOL_PROFILE": "curated"
```

For production:

```bash
node scripts/ghl-mcp.mjs configure codex --profile stable
```

For full API coverage:

```bash
node scripts/ghl-mcp.mjs configure codex --profile full
```

Validate setup:

```bash
npm run build
npm run doctor
npm run auth-check
```

