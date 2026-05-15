#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const command = args[0] || 'help';

loadDotEnv();

const commands = {
  help,
  doctor,
  'auth-check': authCheck,
  'list-tools': listTools,
  'test-tool': testTool,
  'env-template': envTemplate,
  configure,
  'update-api': updateApi,
  explorer,
  report,
};

if (!commands[command]) {
  fail(`Unknown command: ${command}\n\n${helpText()}`);
}

await commands[command](args.slice(1));

function help() {
  console.log(helpText());
}

function helpText() {
  return `GoHighLevel MCP companion CLI

Usage:
  ghl-mcp <command> [options]

Commands:
  doctor                     Check local setup, build output, env, and API coverage files
  auth-check                 Run a read-only GHL API token/location check
  list-tools                 List MCP tools from the built registry
  test-tool <name> [json]    Execute one tool locally with JSON arguments
  env-template               Print a minimal .env template
  configure <client>         Print MCP client config JSON for claude, cursor, windsurf, codex
  update-api                 Refresh official GHL API scan and generated tools
  explorer                   Print the local static tool explorer path
  report                     Generate docs/API-DASHBOARD.md and docs/tool-inventory.json

Options:
  --json                     Emit JSON where supported
  --search <text>            Filter list-tools output
  --category <name>          Filter list-tools output by category/module
  --confirm                  Allow test-tool to run write/destructive tools
`;
}

async function doctor() {
  const pkg = readJson('package.json');
  const coverage = readCoverage();
  const checks = [
    check('Node >= 18', Number(process.versions.node.split('.')[0]) >= 18, process.version),
    check('package.json', Boolean(pkg.name), pkg.name || 'missing'),
    check('dist/server.js', existsSync(join(repoRoot, 'dist/server.js')), existsSync(join(repoRoot, 'dist/server.js')) ? 'present' : 'run npm run build'),
    check('dist/main.js', existsSync(join(repoRoot, 'dist/main.js')), existsSync(join(repoRoot, 'dist/main.js')) ? 'present' : 'run npm run build'),
    check('coverage report', Boolean(coverage), 'docs/ghl-api-coverage.json'),
    check('GHL_API_KEY', Boolean(process.env.GHL_API_KEY), mask(process.env.GHL_API_KEY)),
    check('GHL_LOCATION_ID', Boolean(process.env.GHL_LOCATION_ID), process.env.GHL_LOCATION_ID || 'missing'),
    check('GHL_API_VERSION', Boolean(process.env.GHL_API_VERSION || '2021-07-28'), process.env.GHL_API_VERSION || '2021-07-28'),
  ];

  if (coverage) {
    checks.push(
      check('official endpoint coverage', coverage.comparison?.coveragePercent === 100, `${coverage.comparison?.coveredCount || 0}/${coverage.comparison?.officialUniqueCount || 0}`),
      check('generated official tools data', existsSync(join(repoRoot, 'src/tools/official-spec-endpoints.json')), 'src/tools/official-spec-endpoints.json')
    );
  }

  printChecks(checks);
  if (checks.some((item) => !item.ok)) process.exitCode = 1;
}

async function authCheck() {
  const apiKey = requireEnv('GHL_API_KEY');
  const locationId = requireEnv('GHL_LOCATION_ID');
  const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
  const version = process.env.GHL_API_VERSION || '2021-07-28';
  const response = await fetch(`${baseUrl}/locations/${encodeURIComponent(locationId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: version,
      Accept: 'application/json',
    },
  });

  console.log(`${response.ok ? 'ok' : 'fail'} auth-check: HTTP ${response.status}`);
  if (!response.ok) {
    const text = await response.text();
    console.log(text.slice(0, 600));
    process.exit(1);
  }
}

async function listTools(argv) {
  const inventory = await getInventory();
  const options = parseOptions(argv);
  const filtered = inventory.filter((tool) => {
    if (options.search && !`${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(options.search.toLowerCase())) return false;
    if (options.category && tool.category !== options.category && tool.module !== options.category) return false;
    return true;
  });

  if (options.json) {
    console.log(JSON.stringify({ count: filtered.length, tools: filtered }, null, 2));
    return;
  }

  console.log(`Tools: ${filtered.length}`);
  for (const tool of filtered) {
    const flags = [tool.access, tool.destructive ? 'destructive' : ''].filter(Boolean).join(', ');
    console.log(`${tool.name}  [${tool.category}; ${flags}]`);
  }
}

async function testTool(argv) {
  const name = argv[0];
  if (!name) fail('Usage: ghl-mcp test-tool <name> [json-arguments] [--confirm]');
  const options = parseOptions(argv.slice(1));
  const jsonArg = argv.find((item, index) => index > 0 && item.trim().startsWith('{'));
  const toolArgs = jsonArg ? JSON.parse(jsonArg) : {};
  const inventory = await getInventory();
  const tool = inventory.find((item) => item.name === name);
  if (!tool) fail(`Unknown tool: ${name}`);
  if (!tool.readOnly && !options.confirm) {
    fail(`Refusing to run ${tool.access} tool without --confirm: ${name}`);
  }

  const { ToolRegistry } = await importBuilt('tool-registry.js');
  const { EnhancedGHLClient } = await importBuilt('enhanced-ghl-client.js');
  const client = new EnhancedGHLClient(readGhlConfig());
  const registry = new ToolRegistry(client);
  const result = await registry.callTool(name, toolArgs);
  console.log(JSON.stringify(result, null, 2));
}

function envTemplate() {
  console.log(`GHL_API_KEY=your_private_integration_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com
GHL_API_VERSION=2021-07-28
MCP_SERVER_PORT=8000
NODE_ENV=development`);
}

function configure(argv) {
  const client = (argv[0] || 'claude').toLowerCase();
  const config = {
    mcpServers: {
      ghl: {
        command: 'node',
        args: [join(repoRoot, 'dist/server.js')],
        env: {
          GHL_API_KEY: '${GHL_API_KEY}',
          GHL_LOCATION_ID: '${GHL_LOCATION_ID}',
          GHL_BASE_URL: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
          GHL_API_VERSION: process.env.GHL_API_VERSION || '2021-07-28',
        },
      },
    },
  };

  if (!['claude', 'cursor', 'windsurf', 'codex'].includes(client)) {
    fail('Supported clients: claude, cursor, windsurf, codex');
  }
  console.log(JSON.stringify(config, null, 2));
}

function updateApi(argv) {
  const options = parseOptions(argv);
  const result = spawnSync('npm', ['run', options.check ? 'ci:ghl-api-drift' : 'scan:ghl-api'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  process.exit(result.status || 0);
}

function explorer() {
  const explorerPath = join(repoRoot, 'docs/tool-explorer.html');
  console.log(explorerPath);
  console.log('Run npm run tools:report first if docs/tool-inventory.json is stale.');
}

async function report() {
  const coverage = readCoverage();
  if (!coverage) fail('Missing docs/ghl-api-coverage.json. Run npm run scan:ghl-api first.');
  const inventory = await getInventory();
  const byCategory = countBy(inventory, 'category');
  const byAccess = countBy(inventory, 'access');
  const officialCommit = coverage.official?.commit || 'unknown';
  const shortCommit = coverage.official?.tag || officialCommit.slice(0, 7);
  const generatedFrom = {
    officialDocsCommit: officialCommit,
    officialDocsTag: shortCommit,
    coveragePercent: coverage.comparison?.coveragePercent || 0,
  };

  mkdirSync(join(repoRoot, 'docs'), { recursive: true });
  writeFileSync(join(repoRoot, 'docs/tool-inventory.json'), JSON.stringify({ generatedFrom, tools: inventory }, null, 2) + '\n');

  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => `| ${name} | ${count} |`)
    .join('\n');

  const dashboard = `# GoHighLevel MCP API Dashboard

Generated from official GHL docs commit: ${shortCommit}

## Coverage

- Official GHL docs source: ${coverage.official?.repo || 'unknown'}
- Official docs commit: ${shortCommit}
- Official endpoints parsed: ${coverage.comparison?.officialUniqueCount || 0}
- Official endpoints covered: ${coverage.comparison?.coveredCount || 0}
- Coverage: ${coverage.comparison?.coveragePercent || 0}%
- MCP tools in registry: ${inventory.length}
- Read tools: ${byAccess.read || 0}
- Write tools: ${(byAccess.write || 0)}
- Delete/destructive tools: ${(byAccess.delete || 0)}
- Local-only endpoint references tracked: ${coverage.comparison?.localOnly?.length || 0}

## Largest Tool Categories

| Category | Tools |
| --- | ---: |
${topCategories}

## Maintenance Commands

\`\`\`bash
npm run tools:doctor
npm run tools:report
npm run scan:ghl-api
npm run ci:ghl-api-drift
\`\`\`

The daily API drift workflow refreshes the official GoHighLevel docs snapshot and opens a PR when generated MCP artifacts change.
`;

  writeFileSync(join(repoRoot, 'docs/API-DASHBOARD.md'), dashboard);
  console.log('Wrote docs/API-DASHBOARD.md');
  console.log('Wrote docs/tool-inventory.json');
}

async function getInventory() {
  ensureBuilt();
  const { ToolRegistry } = await importBuilt('tool-registry.js');
  const { EnhancedGHLClient } = await importBuilt('enhanced-ghl-client.js');
  const client = new EnhancedGHLClient({
    accessToken: process.env.GHL_API_KEY || 'tooling-token',
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2021-07-28',
    locationId: process.env.GHL_LOCATION_ID || 'tooling-location',
  });
  return new ToolRegistry(client).getToolInventory();
}

function ensureBuilt() {
  if (existsSync(join(repoRoot, 'dist/tool-registry.js')) && existsSync(join(repoRoot, 'dist/enhanced-ghl-client.js'))) return;
  console.log('Build output missing; running npm run build...');
  const result = spawnSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}

function importBuilt(file) {
  return import(pathToFileURL(join(repoRoot, 'dist', file)).href);
}

function readGhlConfig() {
  return {
    accessToken: requireEnv('GHL_API_KEY'),
    baseUrl: process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com',
    version: process.env.GHL_API_VERSION || '2021-07-28',
    locationId: requireEnv('GHL_LOCATION_ID'),
  };
}

function readCoverage() {
  try {
    return readJson('docs/ghl-api-coverage.json');
  } catch {
    return null;
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(join(repoRoot, path), 'utf8'));
}

function loadDotEnv() {
  const path = join(repoRoot, '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseOptions(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--json') options.json = true;
    if (item === '--confirm') options.confirm = true;
    if (item === '--check') options.check = true;
    if (item === '--search') options.search = argv[++i] || '';
    if (item === '--category') options.category = argv[++i] || '';
  }
  return options;
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

function printChecks(checks) {
  for (const item of checks) {
    console.log(`${item.ok ? 'ok' : 'fail'} ${item.name}: ${item.detail}`);
  }
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function requireEnv(name) {
  if (!process.env[name]) fail(`${name} is required`);
  return process.env[name];
}

function mask(value) {
  if (!value) return 'missing';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
