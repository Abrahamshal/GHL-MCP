# API Coverage

The repo tracks official HighLevel API coverage and generated MCP tools.

Current summary:

- Official endpoints parsed: `590`
- Official endpoint coverage: `590 / 590`
- Generated official endpoint tools: `238`
- MCP tools in registry: `848`
- Local-only endpoint references tracked: `253`

Important files:

- `docs/GHL-API-COVERAGE-REPORT.md`
- `docs/GHL-LOCAL-ENDPOINT-CLASSIFICATION.md`
- `docs/api-sources.lock.json`
- `docs/ghl-api-coverage.json`
- `docs/API-DASHBOARD.md`
- `docs/tool-inventory.json`

Refresh only when intentionally updating API coverage:

```bash
npm run scan:ghl-api
```

