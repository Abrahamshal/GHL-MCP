# API Coverage Dashboard

The API coverage tooling answers one MCP question: does this server expose tools for the current official GoHighLevel API surface, and which local endpoints need review?

## Outputs

| File | Role |
| --- | --- |
| `docs/GHL-API-COVERAGE-REPORT.md` | Human report with source snapshot, coverage summary, app-area table, high-priority gaps, and update plan. |
| `docs/GHL-LOCAL-ENDPOINT-CLASSIFICATION.md` | Human classification of local-only endpoints into changelog-only, legacy/private/internal, compatibility wrappers, dynamic/templated, and manual review buckets. |
| `docs/ghl-api-coverage.json` | Machine-readable source for generated official spec tools and downstream dashboards. |
| `docs/API-DASHBOARD.md` | Compact dashboard for coverage, registry totals, access levels, and top categories. |
| `docs/tool-inventory.json` | Machine-readable inventory of registered MCP tools with category, access, source, scopes, and endpoint metadata. |
| `docs/tool-explorer.html` | Static explorer that can browse and filter the generated tool inventory. |

These files are generated artifacts. Do not hand edit them; rerun `npm run scan:ghl-api`.

## Scanner Inputs

- Official endpoint references come from `GoHighLevel/highlevel-api-docs`, checked out under `tmp/highlevel-api-docs`.
- Local endpoint references are scanned from TypeScript files under `src/`.
- Generated official spec endpoint data is included so the scanner can tell whether generated MCP tools cover missing handwritten tools.

## Reading The Report

- `Exact-match coverage` is a conservative method/path match after path normalization.
- `Likely missing official endpoints` means the current MCP surface has no local or generated exact match.
- `Potential local-only/deprecated/private endpoints` means the server references endpoints not found in the official docs snapshot.
- App-area rows help prioritize work by GHL product surface.

## Review Policy

When coverage changes:

1. Check the docs commit in the source snapshot.
2. Review missing official endpoints first; these may need generated fallback tools or handwritten tools.
3. Review local-only endpoints before deleting anything. They may be compatibility wrappers, changelog-only endpoints, or private APIs this MCP server intentionally supports.
4. Keep compatibility aliases when renaming MCP tools would break client workflows.
