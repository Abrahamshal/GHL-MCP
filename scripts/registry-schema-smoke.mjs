/**
 * Verify registered tools expose their input schemas over MCP and that
 * arguments flow through to executeTool (regression: schemas were dropped).
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
process.env.GHL_TOOL_PROFILE = 'curated';

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js');
const { ToolRegistry } = require('../dist/tool-registry.js');
const { EnhancedGHLClient } = require('../dist/enhanced-ghl-client.js');

const results = [];
const check = (name, cond, extra = '') => { results.push(!!cond); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ->  ' + extra : ''}`); };

const client = new EnhancedGHLClient({ accessToken: 'fake', baseUrl: 'https://services.leadconnectorhq.com', version: '2023-02-21', locationId: 'fake-loc' });
const registry = new ToolRegistry(client);

// Intercept executeTool to capture what args actually arrive.
let captured = null;
const origCall = registry.callTool.bind(registry);
for (const mod of registry.modules ?? []) { /* modules private; capture via monkey-patching below */ }

const server = new McpServer({ name: 't', version: '1' }, { capabilities: { tools: {} } });
const count = registry.registerAll(server);
check('tools registered', count > 30, `count=${count}`);

const [ct, st] = InMemoryTransport.createLinkedPair();
const mcpClient = new Client({ name: 'probe', version: '1' });
await Promise.all([mcpClient.connect(ct), server.connect(st)]);

const { tools } = await mcpClient.listTools();
const withParams = tools.filter((t) => t.inputSchema && t.inputSchema.properties && Object.keys(t.inputSchema.properties).length > 0);
check('most tools expose parameters', withParams.length >= Math.floor(tools.length * 0.5), `${withParams.length}/${tools.length} have params`);

const convo = tools.find((t) => t.name === 'crm_conversation_workspace');
check('crm_conversation_workspace exists', !!convo);
const convoProps = Object.keys(convo?.inputSchema?.properties ?? {});
check('conversation workspace has params', convoProps.length > 0, convoProps.join(','));

// Args flow: call a tool with a parameter; the GHL client will fail (fake key),
// but the error must NOT be a schema rejection — meaning args passed validation.
const anyParamTool = convo && convoProps.length ? convo : withParams[0];
const argKey = Object.keys(anyParamTool.inputSchema.properties)[0];
const res = await mcpClient.callTool({ name: anyParamTool.name, arguments: { [argKey]: 'test-value-123' } });
const text = JSON.stringify(res.content ?? res);
// The passed value must appear in the tool's work (e.g. in the API path it
// attempted) — proving arguments reach the underlying implementation.
check('args flow through to the tool', text.includes('test-value-123'), `arg=${argKey}`);

// Conditional reads + lean envelopes (curated ergonomics):
const targeted = await mcpClient.callTool({ name: 'crm_conversation_workspace', arguments: { conversationId: 'c-1', contactId: 'k-1' } });
const targetedText = JSON.stringify(targeted.content ?? targeted);
check('targeted lookup skips inbox sweep', !targetedText.includes('Conversation search'));
check('read envelope is lean (no proposedActions/nextSteps)', !targetedText.includes('proposedActions') && !targetedText.includes('nextSteps'));
const broad = await mcpClient.callTool({ name: 'crm_conversation_workspace', arguments: {} });
check('bare call still sweeps inbox', JSON.stringify(broad.content ?? broad).includes('Conversation search'));
const nextPage = await mcpClient.callTool({ name: 'crm_get_next_page', arguments: { limit: 5 } });
check('buildActions read tool keeps proposedActions', JSON.stringify(nextPage.content ?? nextPage).includes('proposedActions'));
const prep = await mcpClient.callTool({ name: 'crm_prepare_contact_note', arguments: { contactId: 'k-1', body: 'hi' } });
check('write tool keeps staging envelope', JSON.stringify(prep.content ?? prep).includes('executeToolCalls'));

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
