# Development

## Commands

```bash
npm run build
npm run lint
npm test
npm run tools:doctor
npm run tools:report
npm run scan:ghl-api
```

Generated files:

- `src/tools/official-spec-tools.ts`
- `src/tools/official-spec-endpoints.json`
- `docs/tool-inventory.json`
- `docs/API-DASHBOARD.md`

Do not hand-edit generated official-spec files.

## CI Expectations

CI should check Node 20, build, lint, tests, no-credentials doctor, config generation, MCP Apps build, docs command validity, and package tarball contents.

