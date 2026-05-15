# Live Smoke Testing

Live smoke tests verify that the MCP server's GHL assumptions still work against a real account. They are intentionally narrow and read-only.

## Command

```sh
npm run smoke:ghl-live
```

The command skips when `GHL_API_KEY` or `GHL_LOCATION_ID` is missing.

## Current Checks

The smoke script performs GET requests for:

- Location lookup.
- Contact search with `pageLimit=1`.
- User search with `limit=1`.
- Email schedule lookup with `campaignsOnly=true`.

Responses from HTTP 200 through HTTP 499 are treated as transport success because auth, scope, and tenant configuration can legitimately produce 4xx results. HTTP 5xx and network failures should fail the run.

## Policy

- Do not create, update, delete, send, publish, charge, enroll, or trigger live GHL resources in smoke tests.
- Do not run live smoke tests in public CI with real credentials.
- Keep logs to status codes and check names; never print tokens, full response bodies, contacts, messages, invoices, or location data.
- Add new checks only when they cover a high-value MCP area and can be kept read-only.

## Environment

```sh
GHL_API_KEY=...
GHL_LOCATION_ID=...
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
```
