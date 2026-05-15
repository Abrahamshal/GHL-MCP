# Daily Drift PR Flow

The daily drift workflow keeps the MCP tool surface aligned with GHL's upstream docs without silently changing runtime behavior.

## Workflow

The GitHub Actions workflow `.github/workflows/ghl-api-drift.yml` has two modes:

| Mode | Trigger | Behavior |
| --- | --- | --- |
| Drift guard | Pull requests and pushes to `main` touching API/tooling paths | Runs `npm run scan:ghl-api` and fails if generated artifacts are stale. |
| Daily update | Schedule and manual dispatch | Runs `npm run scan:ghl-api` and opens a PR when generated artifacts changed. |

The scheduled PR uses branch `codex/daily-ghl-api-refresh` and commits `chore: refresh GHL API artifacts`.

## Generated Files In Scope

The workflow may update:

- `docs/GHL-API-COVERAGE-REPORT.md`
- `docs/GHL-LOCAL-ENDPOINT-CLASSIFICATION.md`
- `docs/ghl-api-coverage.json`
- `docs/API-DASHBOARD.md`
- `docs/tool-inventory.json`
- `src/tools/official-spec-tools.ts`
- `src/tools/official-spec-endpoints.json`

## Review Checklist

1. Confirm the upstream docs commit changed in the report source snapshot.
2. Check whether `Likely missing official endpoints` increased.
3. Inspect local-only endpoint classification changes before retiring any MCP tools.
4. Verify generated official tools still use stable MCP names and metadata.
5. Run `npm run build` and targeted tests before merging if generated tool code changed.

## Merge Policy

Generated-only drift PRs can be merged when the scanner output is coherent and the build passes. If the PR reveals new official endpoints that need better names, custom schemas, or compatibility aliases, land those as a follow-up MCP tool PR instead of editing generated artifacts by hand.
