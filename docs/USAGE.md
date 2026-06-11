# Usage

## Start The Server

```bash
npm run start:stdio
npm run start:http
npm run start:legacy
```

Most desktop MCP clients should use stdio.

## Tool Discovery

```bash
npm run tools:list -- --search contacts
npm run tools:list -- --category contacts
npm run tools:list -- --stability official
npm run tools:list -- --access read
npm run tools:list -- --access write
npm run tools:list -- --access delete
npm run tools:list -- --destructive
GHL_TOOL_PROFILE=curated npm run tools:list
```

Use the read-only views first when testing a new token/location.

## Common Workflows

- Contacts: search, create, update, tag, dedupe, and add notes.
- Notes: create, update, list, and delete contact notes.
- Conversations: search threads, inspect messages, draft SMS/email replies.
- Appointments: inspect calendars, find slots, prepare bookings.
- Opportunities: list pipelines, inspect deals, prepare stage changes.
- Invoices: prepare invoices and billing workflows.
- Reviews: prepare review replies and review request workflows.
- Workflows: prepare safe workflow enrollment.
- Media: list and upload media where supported.
- Location health: inspect users, locations, setup health, and operational gaps.

## Starter Prompts

CRM assistant:

```text
Use the curated GoHighLevel MCP tools. Help me search contacts, inspect context, and prepare safe updates. Ask before executing any write action.
```

Appointment setter:

```text
Use GoHighLevel calendar and contact tools to prepare appointment booking options. Stage the booking for confirmation before writing.
```

Pipeline manager:

```text
Review opportunities, identify stale deals, and prepare stage/task/note actions for confirmation.
```

Reputation assistant:

```text
Review recent reputation data and prepare review replies or review request actions for confirmation.
```

Agency admin:

```text
Inspect location health, users, snapshots, phone/media setup, and produce a prioritized action list.
```

Ads reporting:

```text
Use read-only reporting tools to summarize campaign performance and attribution. Do not modify campaigns.
```
