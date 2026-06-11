# Safety

## Defaults

- Use `GHL_TOOL_PROFILE=curated` for new users.
- Use `GHL_TOOL_PROFILE=stable` for production.
- Do not commit `.env`.
- Do not print full API keys.

## Writes And Destructive Actions

`node scripts/ghl-mcp.mjs test-tool` refuses write/delete tools unless `--confirm` is present.

Curated workflow tools prepare action queues so humans can confirm outbound messages, billing, workflow enrollment, stage moves, deletes, and snapshot pushes before execution.

## Audit Guidance

For any write:

- Record the user request.
- Record the staged tool calls.
- Confirm the target location/contact/opportunity.
- Confirm the final result.

