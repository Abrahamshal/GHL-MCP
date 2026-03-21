# Signet Integration Guide

[Signet](https://signet.sh) is a portable agent identity system that provides:
- Secure secret storage (API keys, tokens)
- Persistent memory across AI sessions
- Portable MCP server configurations
- Works across Claude Code, Cursor, OpenCode, and other AI platforms

---

## Quick Setup

### 1. Install Signet

```bash
npm install -g signet-cli
# or
curl -fsSL https://signet.sh/install.sh | bash
```

### 2. Store your GHL credentials

```bash
# Store securely (prompts for value)
signet secret put GHL_API_KEY
signet secret put GHL_LOCATION_ID

# Verify
signet secret list
```

### 3. Start the MCP server with Signet secrets

```bash
# Inject secrets at startup
GHL_API_KEY=$(signet secret get GHL_API_KEY) \
GHL_LOCATION_ID=$(signet secret get GHL_LOCATION_ID) \
GHL_BASE_URL=https://services.leadconnectorhq.com \
node /path/to/dist/server.js
```

---

## Claude Desktop Config (with Signet)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ghl-mcp-server": {
      "command": "sh",
      "args": [
        "-c",
        "GHL_API_KEY=$(signet secret get GHL_API_KEY) GHL_LOCATION_ID=$(signet secret get GHL_LOCATION_ID) GHL_BASE_URL=https://services.leadconnectorhq.com node /absolute/path/to/dist/server.js"
      ]
    }
  }
}
```

---

## Cursor Config (with Signet)

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ghl-mcp-server": {
      "command": "sh",
      "args": [
        "-c",
        "GHL_API_KEY=$(signet secret get GHL_API_KEY) GHL_LOCATION_ID=$(signet secret get GHL_LOCATION_ID) GHL_BASE_URL=https://services.leadconnectorhq.com node /absolute/path/to/dist/server.js"
      ]
    }
  }
}
```

---

## Signet agent.yaml (Full Config)

If you're using Signet's agent system, add to `~/.agents/agent.yaml`:

```yaml
mcp_servers:
  ghl-mcp-server:
    command: node
    args: ["/absolute/path/to/Go-High-Level-MCP-2026-Complete/dist/server.js"]
    env:
      GHL_API_KEY: "${signet:GHL_API_KEY}"
      GHL_BASE_URL: "https://services.leadconnectorhq.com"
      GHL_LOCATION_ID: "${signet:GHL_LOCATION_ID}"
    description: "GoHighLevel CRM — 520+ tools"
```

---

## Using Signet Memory with GHL MCP

Store important GHL context in Signet memory so your AI assistant remembers it across sessions:

```bash
# Remember your GHL setup
signet remember "GHL location ID is {your_location_id}, using sub-account for {agency_name}" -t ghl,crm

# Remember common workflows
signet remember "GHL pipeline: lead comes in → create contact → add to Nurture pipeline → send SMS" -t ghl,workflow

# Recall context anytime
signet recall "GHL setup"
signet recall "GHL pipeline"
```

---

## Troubleshooting

### Signet not found in Claude Desktop

If `signet` isn't on the PATH in Claude Desktop's shell context, use the full path:

```json
{
  "mcpServers": {
    "ghl-mcp-server": {
      "command": "sh",
      "args": [
        "-c",
        "GHL_API_KEY=$(/usr/local/bin/signet secret get GHL_API_KEY) node /path/to/dist/server.js"
      ]
    }
  }
}
```

Find your signet path with `which signet`.

### Verify your GHL API key works

```bash
# Test the connection
GHL_API_KEY=$(signet secret get GHL_API_KEY) \
GHL_LOCATION_ID=$(signet secret get GHL_LOCATION_ID) \
GHL_BASE_URL=https://services.leadconnectorhq.com \
node dist/server.js &

# Then use an MCP client to call health_check
```

---

## Need Help?

- Signet docs: https://signet.sh/docs
- GHL MCP issues: https://github.com/BusyBee3333/Go-High-Level-MCP-2026-Complete/issues
- Managed hosting: [jake@localbosses.org](mailto:jake@localbosses.org)
