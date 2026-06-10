# GHL API Coverage Report

Generated from official GHL docs commit: ae4d260

## Source Snapshot

- Official docs repo: https://github.com/GoHighLevel/highlevel-api-docs.git
- Docs checkout: `tmp/highlevel-api-docs`
- Docs commit: `ae4d260aada8e4340e1603a5573f977778e13ffd`
- Docs tag/description: `ae4d260`
- Official endpoint references parsed: 590
- Local endpoint references parsed: 847
- Local TypeScript files scanned: 59

## Coverage Summary

- Unique official endpoints: 590
- Unique local endpoints: 843
- Official endpoints with an exact method/path match locally: 590
- Exact-match coverage: 100%
- Likely missing official endpoints: 0
- Potential local-only/deprecated/private endpoints: 253

Exact matching is intentionally conservative. Dynamic path generation, aliases, and compatibility wrappers may create false positives, but this gives us a repeatable first-pass map.

## Changelog-Only Findings To Plan Around

- 2026-04-28 — Users: GET /users/ endpoint deprecated (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-04-21 — Notes: Top-level Notes endpoints added: POST /notes/, POST /notes/search, DELETE /notes/{id}, GET /notes/{id}, PUT /notes/{id}, PATCH /notes/{id}/attachments, PUT /notes/{id}/relations, POST /notes/{id}/restore (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- 2026-04-15 — Users/Scopes: New user scope enum values added for audit logs, location management, and payments settings (https://marketplace.gohighlevel.com/docs/Changelog/index.html)
- Recent product changelog — Emails: Email Campaign V2 APIs introduced; future email campaign improvements focus on V2 endpoints (https://ideas.gohighlevel.com/changelog/new-improved-email-marketing-public-apis)

## Coverage By Official App Area

| App area | Official endpoints | Exact local matches | Missing |
| --- | ---: | ---: | ---: |
| ad-manager | 94 | 94 | 0 |
| invoices | 42 | 42 | 0 |
| calendars | 41 | 41 | 0 |
| social-media-posting | 40 | 40 | 0 |
| contacts | 32 | 32 | 0 |
| conversations | 29 | 29 | 0 |
| locations | 29 | 29 | 0 |
| products | 27 | 27 | 0 |
| payments | 23 | 23 | 0 |
| saas-api | 22 | 22 | 0 |
| emails | 19 | 19 | 0 |
| store | 18 | 18 | 0 |
| knowledge-base | 14 | 14 | 0 |
| conversation-ai | 12 | 12 | 0 |
| opportunities | 12 | 12 | 0 |
| agent-studio | 11 | 11 | 0 |
| voice-ai | 11 | 11 | 0 |
| associations | 10 | 10 | 0 |
| marketplace | 9 | 9 | 0 |
| objects | 9 | 9 | 0 |
| custom-fields | 8 | 8 | 0 |
| blogs | 7 | 7 | 0 |
| funnels | 7 | 7 | 0 |
| medias | 7 | 7 | 0 |
| users | 7 | 7 | 0 |
| links | 6 | 6 | 0 |
| brand-boards | 5 | 5 | 0 |
| businesses | 5 | 5 | 0 |
| custom-menus | 5 | 5 | 0 |
| affiliate-manager | 4 | 4 | 0 |
| phone-system | 4 | 4 | 0 |
| proposals | 4 | 4 | 0 |
| snapshots | 4 | 4 | 0 |
| forms | 3 | 3 | 0 |
| oauth | 3 | 3 | 0 |
| surveys | 2 | 2 | 0 |
| campaigns | 1 | 1 | 0 |
| companies | 1 | 1 | 0 |
| courses | 1 | 1 | 0 |
| email-isv | 1 | 1 | 0 |
| workflows | 1 | 1 | 0 |

## High-Priority Missing Official Endpoints

- None found.

## Potential Local-Only High-Risk Endpoints

These deserve manual review because they may be legacy, private, renamed, or simply not matched by the scanner.

- `DELETE /affiliates/campaigns/{param}` — src/tools/affiliates-tools.ts — makeRequest
- `DELETE /campaigns/scheduled-messages/{param}` — src/tools/campaigns-tools.ts — makeRequest
- `DELETE /campaigns/{param}` — src/tools/campaigns-tools.ts — makeRequest
- `DELETE /contacts/{param}/campaigns` — src/clients/ghl-api-client.ts — axiosInstance
- `GET /affiliates/campaigns` — src/tools/affiliates-tools.ts — makeRequest
- `GET /affiliates/campaigns/{param}` — src/tools/affiliates-tools.ts — makeRequest
- `GET /campaigns/scheduled-messages` — src/tools/campaigns-tools.ts — makeRequest
- `GET /campaigns/{param}` — src/tools/campaigns-tools.ts — makeRequest
- `GET /campaigns/{param}/recipients` — src/tools/campaigns-tools.ts — makeRequest
- `GET /campaigns/{param}/stats` — src/tools/campaigns-tools.ts — makeRequest
- `GET /reporting/emails` — src/tools/reporting-tools.ts — makeRequest
- `POST /affiliates/campaigns` — src/tools/affiliates-tools.ts — makeRequest
- `POST /campaigns/` — src/tools/campaigns-tools.ts — makeRequest
- `POST /campaigns/{param}/pause` — src/tools/campaigns-tools.ts — makeRequest
- `POST /campaigns/{param}/resume` — src/tools/campaigns-tools.ts — makeRequest
- `POST /campaigns/{param}/start` — src/tools/campaigns-tools.ts — makeRequest
- `PUT /affiliates/campaigns/{param}` — src/tools/affiliates-tools.ts — makeRequest
- `PUT /campaigns/{param}` — src/tools/campaigns-tools.ts — makeRequest

## Recommended Update Plan

1. Keep the scanner pointed at both the official GitHub OpenAPI fragments and live-docs supplemental endpoints that have not landed in the GitHub repo yet.
2. Make `GHL_API_VERSION` configurable in all server entry points and keep endpoint-specific overrides for APIs that still require older version headers.
3. Mark deprecated `GET /users/` behavior clearly in user-facing docs/tool descriptions while preserving compatibility as long as the official spec still lists it.
4. Keep the first-class top-level Notes module in place for the 2026-04-21 changelog endpoints, and reconcile it against the official spec once those endpoints land in the docs repo.
5. Keep Email Campaign V2 tools under `/emails/public/v2/*` as live-docs supplemental coverage until HighLevel publishes them in `apps/emails.json`.
6. Update OAuth/private-integration scope documentation for new audit-log, location-management, and payment-settings scopes.
7. Manually inspect local-only campaign, workflow, OAuth, and trigger endpoints. If they are internal/private APIs, mark them clearly in tool descriptions and README so users know their stability profile.
8. Add targeted tests for live-docs supplemental modules using the current official path, method, version header, and required query/body fields.

## Full Machine-Readable Output

See `docs/ghl-api-coverage.json` for the complete parsed endpoint lists.
