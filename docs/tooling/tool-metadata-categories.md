# Tool Metadata Categories

MCP clients need enough metadata to filter tools by product area, risk, and source. This server uses `_meta.labels` plus `_meta.official` for generated official tools.

## Label Shape

```ts
{
  _meta: {
    labels: {
      category: "official-contacts",
      access: "read",
      complexity: "generated",
      source: "official-ghl-openapi"
    },
    official: {
      app: "contacts",
      operationId: "getContacts",
      method: "GET",
      path: "/contacts/",
      versions: ["2021-07-28"],
      scopes: ["contacts.readonly"]
    }
  }
}
```

## Categories

Use stable, lowercase categories:

| Category pattern | Meaning |
| --- | --- |
| `official-{app}` | Generated directly from the official GHL OpenAPI app area. |
| `{module}` | Handwritten local module category, such as `contacts`, `calendars`, `webhooks`, or `workflows`. |
| `general` | Temporary category for local tools that need a better module category. |

Do not encode access level, API version, or tenant in `category`; those belong in other metadata fields.

## Access

| Access | Use |
| --- | --- |
| `read` | GET/list/search/lookup operations. |
| `write` | Create, update, send, publish, trigger, import, or state-changing operations. |
| `delete` | Delete, archive, remove, or destructive operations. |

When in doubt, choose the more cautious access label.

## Complexity

| Complexity | Use |
| --- | --- |
| `generated` | Tool generated from official OpenAPI fragments. |
| `handwritten` | Tool with custom implementation, custom schema, or compatibility behavior. |
| `compatibility` | Tool retained primarily to preserve an older MCP client workflow. |
| `internal` | Tool backed by private, legacy, or not-yet-official endpoints. |

## Source

| Source | Use |
| --- | --- |
| `official-ghl-openapi` | Endpoint came from the official docs repo. |
| `local-tool-module` | Endpoint came from handwritten MCP code. |
| `ghl-changelog` | Endpoint is documented in changelog but not yet in the official OpenAPI snapshot. |
| `legacy-or-private` | Endpoint is intentionally supported but not present in official docs. |

## Client Behavior

MCP clients can use these labels to:

- Hide destructive tools by default.
- Group tools by GHL app area.
- Prefer handwritten tools over generated fallback tools when names overlap.
- Warn users before invoking internal or compatibility endpoints.
