#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const docsRepoUrl = 'https://github.com/GoHighLevel/highlevel-api-docs.git';
const defaultDocsDir = join(repoRoot, 'tmp', 'highlevel-api-docs');
const defaultReportPath = join(repoRoot, 'docs', 'GHL-API-COVERAGE-REPORT.md');
const defaultJsonPath = join(repoRoot, 'docs', 'ghl-api-coverage.json');
const defaultLockPath = join(repoRoot, 'docs', 'api-sources.lock.json');
const sourceVerifiedDate = '2026-06-10';
const httpMethods = new Set(['get', 'post', 'put', 'patch', 'delete']);
const supplementalOfficialEndpoints = [
  {
    method: 'POST',
    path: '/emails/public/v2/locations/{locationId}/campaigns/email-campaign',
    app: 'emails',
    operationId: 'create-email-campaign-v2',
    summary: 'Create Email Campaign V2',
    sourceFile: 'live-docs:ghl/emails/create-email-campaign-v-2',
  },
  {
    method: 'GET',
    path: '/emails/public/v2/locations/{locationId}/campaigns/emails',
    app: 'emails',
    operationId: 'list-email-campaigns-v2',
    summary: 'List Email Campaigns V2',
    sourceFile: 'live-docs:ghl/emails/list-email-campaigns-v-2',
  },
  {
    method: 'PATCH',
    path: '/emails/public/v2/locations/{locationId}/campaigns/{campaignId}',
    app: 'emails',
    operationId: 'update-email-campaign-v2',
    summary: 'Update Email Campaign V2',
    sourceFile: 'live-docs:ghl/emails/update-email-campaign-v-2',
  },
  {
    method: 'DELETE',
    path: '/emails/public/v2/locations/{locationId}/campaigns/{campaignId}',
    app: 'emails',
    operationId: 'delete-email-campaign-v2',
    summary: 'Delete Email Campaign V2',
    sourceFile: 'live-docs:ghl/emails/delete-campaign-v-2',
  },
  {
    method: 'GET',
    path: '/emails/public/v2/locations/{locationId}/campaigns/workflows',
    app: 'emails',
    operationId: 'list-workflow-campaigns-v2',
    summary: 'List Workflow Campaigns V2',
    sourceFile: 'live-docs:ghl/emails/list-workflow-campaigns-v-2',
  },
  {
    method: 'GET',
    path: '/emails/public/v2/locations/{locationId}/campaigns/bulk-actions',
    app: 'emails',
    operationId: 'list-bulk-action-campaigns-v2',
    summary: 'List Bulk Action Campaigns V2',
    sourceFile: 'live-docs:ghl/emails/list-bulk-action-campaigns-v-2',
  },
  {
    method: 'POST',
    path: '/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule',
    app: 'emails',
    operationId: 'schedule-email-campaign-v2',
    summary: 'Schedule Campaign V2',
    sourceFile: 'live-docs:ghl/emails/schedule-campaign-v-2',
  },
  {
    method: 'POST',
    path: '/emails/public/v2/locations/{locationId}/templates',
    app: 'emails',
    operationId: 'create-email-template-v2',
    summary: 'Create Email Template V2',
    sourceFile: 'live-docs:ghl/emails/create-email-template-v-2',
  },
  {
    method: 'GET',
    path: '/emails/public/v2/locations/{locationId}/templates',
    app: 'emails',
    operationId: 'list-email-templates-v2',
    summary: 'List Email Templates V2',
    sourceFile: 'live-docs:ghl/emails/list-email-templates-v-2',
  },
  {
    method: 'POST',
    path: '/emails/public/v2/locations/{locationId}/templates/import',
    app: 'emails',
    operationId: 'import-email-template-v2',
    summary: 'Import Email Template V2',
    sourceFile: 'live-docs:ghl/emails/import-email-template-v-2',
  },
  {
    method: 'POST',
    path: '/emails/public/v2/locations/{locationId}/templates/folders',
    app: 'emails',
    operationId: 'create-template-folder-v2',
    summary: 'Create Email Template Folder V2',
    sourceFile: 'live-docs:ghl/emails/create-template-folder-v-2',
  },
  {
    method: 'DELETE',
    path: '/emails/public/v2/locations/{locationId}/templates/{templateId}',
    app: 'emails',
    operationId: 'delete-email-template-v2',
    summary: 'Delete Email Template V2',
    sourceFile: 'live-docs:ghl/emails/delete-email-template-v-2',
  },
  {
    method: 'PATCH',
    path: '/emails/public/v2/locations/{locationId}/templates/{templateId}',
    app: 'emails',
    operationId: 'update-email-template-v2',
    summary: 'Update Email Template V2',
    sourceFile: 'live-docs:ghl/emails/update-email-template-v-2',
  },
  {
    method: 'GET',
    path: '/emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}',
    app: 'emails',
    operationId: 'get-campaign-stats-v2',
    summary: 'Get Campaign Statistics V2',
    sourceFile: 'live-docs:ghl/emails/get-campaign-stats-under-campaigns-v-2',
  },
];

const args = parseArgs(process.argv.slice(2));
const docsDir = args['docs-dir'] ? resolveFromRoot(args['docs-dir']) : defaultDocsDir;
const reportPath = args.out ? resolveFromRoot(args.out) : defaultReportPath;
const jsonPath = args.json ? resolveFromRoot(args.json) : defaultJsonPath;
const lockPath = args.lock ? resolveFromRoot(args.lock) : defaultLockPath;

ensureDocsRepo(docsDir, args.refresh === true);

const official = extractOfficialEndpoints(docsDir);
const local = extractLocalEndpoints(join(repoRoot, 'src'));
const changelogFindings = [
  {
    date: '2026-04-28',
    area: 'Users',
    change: 'GET /users/ endpoint deprecated',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-04-21',
    area: 'Notes',
    change: 'Top-level Notes endpoints added: POST /notes/, POST /notes/search, DELETE /notes/{id}, GET /notes/{id}, PUT /notes/{id}, PATCH /notes/{id}/attachments, PUT /notes/{id}/relations, POST /notes/{id}/restore',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: '2026-04-15',
    area: 'Users/Scopes',
    change: 'New user scope enum values added for audit logs, location management, and payments settings',
    source: 'https://marketplace.gohighlevel.com/docs/Changelog/index.html',
  },
  {
    date: 'Recent product changelog',
    area: 'Emails',
    change: 'Email Campaign V2 APIs introduced; future email campaign improvements focus on V2 endpoints',
    source: 'https://ideas.gohighlevel.com/changelog/new-improved-email-marketing-public-apis',
  },
];

const comparison = compareEndpoints(official.endpoints, local.endpoints);
const report = buildReport({ official, local, comparison, changelogFindings, docsDir });
const sourceLock = buildSourceLock({ official, comparison });

mkdirSync(dirname(reportPath), { recursive: true });
writeFileSync(reportPath, report);
writeFileSync(jsonPath, JSON.stringify({ official, local, comparison, changelogFindings }, null, 2));
writeFileSync(lockPath, JSON.stringify(sourceLock, null, 2) + '\n');

console.log(`Wrote ${relative(repoRoot, reportPath)}`);
console.log(`Wrote ${relative(repoRoot, jsonPath)}`);
console.log(`Wrote ${relative(repoRoot, lockPath)}`);
console.log(`Official endpoints: ${official.endpoints.length}`);
console.log(`Local endpoint references: ${local.endpoints.length}`);
console.log(`Likely missing official endpoints: ${comparison.missingOfficial.length}`);
console.log(`Potential local-only endpoints: ${comparison.localOnly.length}`);

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function resolveFromRoot(path) {
  return path.startsWith('/') ? path : join(repoRoot, path);
}

function runGit(args, cwd = repoRoot) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function ensureDocsRepo(dir, refresh) {
  if (!isExpectedDocsRepo(dir)) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
    mkdirSync(dirname(dir), { recursive: true });
    runGit(['clone', '--depth', '1', docsRepoUrl, dir]);
    return;
  }

  if (refresh) {
    runGit(['fetch', '--depth', '1', 'origin', 'main'], dir);
    runGit(['checkout', 'FETCH_HEAD'], dir);
  }
}

function isExpectedDocsRepo(dir) {
  if (!existsSync(dir)) return false;
  const gitRoot = safeGit(['rev-parse', '--show-toplevel'], dir);
  if (gitRoot !== dir) return false;

  const originUrl = safeGit(['config', '--get', 'remote.origin.url'], dir);
  return normalizeGitUrl(originUrl) === normalizeGitUrl(docsRepoUrl);
}

function normalizeGitUrl(url) {
  return url
    .trim()
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');
}

function extractOfficialEndpoints(dir) {
  const appsDir = join(dir, 'apps');
  const endpoints = [];

  for (const file of readdirSync(appsDir).filter((name) => name.endsWith('.json')).sort()) {
    const appName = file.replace(/\.json$/, '');
    const spec = JSON.parse(readFileSync(join(appsDir, file), 'utf8'));
    for (const [path, operations] of Object.entries(spec.paths ?? {})) {
      for (const [method, operation] of Object.entries(operations ?? {})) {
        if (!httpMethods.has(method.toLowerCase())) continue;
        endpoints.push({
          key: makeKey(method, path),
          method: method.toUpperCase(),
          path,
          normalizedPath: normalizePath(path),
          app: appName,
          operationId: operation.operationId ?? '',
          summary: operation.summary ?? '',
          versions: extractVersions(operation),
          scopes: extractScopes(operation),
          sourceFile: `apps/${file}`,
        });
      }
    }
  }

  endpoints.push(...supplementalOfficialEndpoints.map((endpoint) => ({
    key: makeKey(endpoint.method, endpoint.path),
    method: endpoint.method,
    path: endpoint.path,
    normalizedPath: normalizePath(endpoint.path),
    app: endpoint.app,
    operationId: endpoint.operationId,
    summary: endpoint.summary,
    versions: ['2023-02-21'],
    scopes: [],
    sourceFile: endpoint.sourceFile,
  })));

  const commit = runGit(['rev-parse', 'HEAD'], dir);
  const tag = safeGit(['describe', '--tags', '--always'], dir);
  return { repo: docsRepoUrl, commit, tag, endpoints };
}

function extractVersions(operation) {
  const versions = new Set();
  for (const param of operation.parameters ?? []) {
    if (param.name === 'Version') {
      for (const value of param.schema?.enum ?? []) versions.add(String(value));
      if (param.schema?.example) versions.add(String(param.schema.example));
    }
  }
  return [...versions].sort();
}

function extractScopes(operation) {
  const scopes = new Set();
  for (const security of operation.security ?? []) {
    for (const values of Object.values(security)) {
      for (const scope of values ?? []) scopes.add(scope);
    }
  }
  return [...scopes].sort();
}

function extractLocalEndpoints(srcDir) {
  const files = listFiles(srcDir).filter((file) => file.endsWith('.ts') && !file.includes('/ui/'));
  const endpoints = [];

  const makeRequestRegex = /makeRequest\(\s*['"`](GET|POST|PUT|PATCH|DELETE)['"`]\s*,\s*(`[^`]+`|'[^']+'|"[^"]+")/g;
  const axiosRegex = /axiosInstance\.(get|post|put|patch|delete)\s*\(\s*(`[^`]+`|'[^']+'|"[^"]+")/g;

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(makeRequestRegex)) {
      addLocalEndpoint(endpoints, file, match[1], match[2], 'makeRequest');
    }
    for (const match of text.matchAll(axiosRegex)) {
      addLocalEndpoint(endpoints, file, match[1], match[2], 'axiosInstance');
    }
  }

  endpoints.push(...extractGeneratedOfficialSpecEndpoints(join(srcDir, 'tools', 'official-spec-endpoints.json')));

  return {
    endpoints,
    filesScanned: files.length,
  };
}

function extractGeneratedOfficialSpecEndpoints(file) {
  if (!existsSync(file)) return [];
  try {
    const endpoints = JSON.parse(readFileSync(file, 'utf8'));
    return endpoints.map((endpoint) => ({
      key: makeKey(endpoint.method, endpoint.path),
      method: endpoint.method,
      path: endpoint.path,
      normalizedPath: normalizePath(endpoint.path),
      sourceFile: relative(repoRoot, file),
      caller: 'official-spec-generated',
    }));
  } catch {
    return [];
  }
}

function addLocalEndpoint(endpoints, file, method, rawPath, caller) {
  const path = cleanLocalPath(rawPath);
  if (!path.startsWith('/')) return;
  endpoints.push({
    key: makeKey(method, path),
    method: method.toUpperCase(),
    path,
    normalizedPath: normalizePath(path),
    sourceFile: relative(repoRoot, file),
    caller,
  });
}

function cleanLocalPath(rawPath) {
  let value = rawPath.slice(1, -1);
  value = value.replace(/\$\{[^}]+\}/g, '{param}');
  value = value.replace(/\?.*$/, '');
  value = value.replace(/([^/])\{param\}$/, '$1');
  value = value.replace(/\/+/g, '/');
  return value;
}

function normalizePath(path) {
  return path
    .replace(/\?.*$/, '')
    .replace(/\$\{[^}]+\}/g, '{param}')
    .replace(/\{[^}/]+\}/g, '{}')
    .replace(/:[^/]+/g, '{}')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function makeKey(method, path) {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

function listFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function compareEndpoints(officialEndpoints, localEndpoints) {
  const officialByKey = groupBy(officialEndpoints, (endpoint) => endpoint.key);
  const localByKey = groupBy(localEndpoints, (endpoint) => endpoint.key);
  const officialKeys = new Set(officialByKey.keys());
  const localKeys = new Set(localByKey.keys());

  const covered = [...officialKeys].filter((key) => localKeys.has(key)).sort();
  const missingOfficial = [...officialKeys]
    .filter((key) => !localKeys.has(key))
    .sort()
    .map((key) => officialByKey.get(key)[0]);
  const localOnly = [...localKeys]
    .filter((key) => !officialKeys.has(key))
    .sort()
    .map((key) => localByKey.get(key)[0]);

  const byApp = {};
  for (const endpoint of officialEndpoints) {
    byApp[endpoint.app] ??= { official: 0, covered: 0, missing: 0 };
    byApp[endpoint.app].official += 1;
    if (localKeys.has(endpoint.key)) byApp[endpoint.app].covered += 1;
    else byApp[endpoint.app].missing += 1;
  }

  return {
    coveredCount: covered.length,
    officialUniqueCount: officialKeys.size,
    localUniqueCount: localKeys.size,
    coveragePercent: officialKeys.size === 0 ? 0 : Math.round((covered.length / officialKeys.size) * 1000) / 10,
    missingOfficial,
    localOnly,
    byApp,
  };
}

function buildSourceLock({ official, comparison }) {
  const supplemental = official.endpoints
    .filter((endpoint) => endpoint.sourceFile?.startsWith('live-docs:'))
    .map((endpoint) => ({
      method: endpoint.method,
      path: endpoint.path,
      app: endpoint.app,
      operationId: endpoint.operationId,
      source: endpoint.sourceFile,
      version: endpoint.versions?.[0] || '2023-02-21',
      verifiedDate: sourceVerifiedDate,
    }))
    .sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));

  return {
    schemaVersion: 1,
    verifiedDate: sourceVerifiedDate,
    primaryApiVersion: '2023-02-21',
    officialDocs: {
      repo: official.repo,
      branch: 'main',
      commit: official.commit,
      tag: official.tag,
      expectedEndpointReferences: official.endpoints.length,
      expectedUniqueEndpoints: comparison.officialUniqueCount,
    },
    liveDocsSupplemental: {
      expectedEndpointReferences: supplemental.length,
      endpoints: supplemental,
    },
    acceptance: {
      expectedMissingOfficialEndpoints: 0,
      expectedCoveragePercent: 100,
    },
  };
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function safeGit(args, cwd) {
  try {
    return runGit(args, cwd);
  } catch {
    return '';
  }
}

function buildReport({ official, local, comparison, changelogFindings, docsDir }) {
  const highPriorityApps = new Set(['users', 'emails', 'campaigns', 'contacts', 'calendars', 'marketplace']);
  const missingHighPriority = comparison.missingOfficial
    .filter((endpoint) => highPriorityApps.has(endpoint.app))
    .slice(0, 80);
  const localOnlyHighRisk = comparison.localOnly
    .filter((endpoint) => !endpoint.path.startsWith('/notes'))
    .filter((endpoint) => /\/users\/?$|\/campaigns|\/emails/.test(endpoint.path))
    .slice(0, 80);
  const appRows = Object.entries(comparison.byApp)
    .sort(([, a], [, b]) => b.missing - a.missing || b.official - a.official)
    .map(([app, stats]) => `| ${app} | ${stats.official} | ${stats.covered} | ${stats.missing} |`)
    .join('\n');

  return `# GHL API Coverage Report

Generated from official GHL docs commit: ${official.tag}

## Source Snapshot

- Official docs repo: ${official.repo}
- Docs checkout: \`${relative(repoRoot, docsDir)}\`
- Docs commit: \`${official.commit}\`
- Docs tag/description: \`${official.tag}\`
- Official endpoint references parsed: ${official.endpoints.length}
- Local endpoint references parsed: ${local.endpoints.length}
- Local TypeScript files scanned: ${local.filesScanned}

## Coverage Summary

- Unique official endpoints: ${comparison.officialUniqueCount}
- Unique local endpoints: ${comparison.localUniqueCount}
- Official endpoints with an exact method/path match locally: ${comparison.coveredCount}
- Exact-match coverage: ${comparison.coveragePercent}%
- Likely missing official endpoints: ${comparison.missingOfficial.length}
- Potential local-only/deprecated/private endpoints: ${comparison.localOnly.length}

Exact matching is intentionally conservative. Dynamic path generation, aliases, and compatibility wrappers may create false positives, but this gives us a repeatable first-pass map.

## Changelog-Only Findings To Plan Around

${changelogFindings.map((item) => `- ${item.date} — ${item.area}: ${item.change} (${item.source})`).join('\n')}

## Coverage By Official App Area

| App area | Official endpoints | Exact local matches | Missing |
| --- | ---: | ---: | ---: |
${appRows}

## High-Priority Missing Official Endpoints

${formatEndpointList(missingHighPriority)}

## Potential Local-Only High-Risk Endpoints

These deserve manual review because they may be legacy, private, renamed, or simply not matched by the scanner.

${formatEndpointList(localOnlyHighRisk)}

## Recommended Update Plan

1. Keep the scanner pointed at both the official GitHub OpenAPI fragments and live-docs supplemental endpoints that have not landed in the GitHub repo yet.
2. Make \`GHL_API_VERSION\` configurable in all server entry points and keep endpoint-specific overrides for APIs that still require older version headers.
3. Mark deprecated \`GET /users/\` behavior clearly in user-facing docs/tool descriptions while preserving compatibility as long as the official spec still lists it.
4. Keep the first-class top-level Notes module in place for the 2026-04-21 changelog endpoints, and reconcile it against the official spec once those endpoints land in the docs repo.
5. Keep Email Campaign V2 tools under \`/emails/public/v2/*\` as live-docs supplemental coverage until HighLevel publishes them in \`apps/emails.json\`.
6. Update OAuth/private-integration scope documentation for new audit-log, location-management, and payment-settings scopes.
7. Manually inspect local-only campaign, workflow, OAuth, and trigger endpoints. If they are internal/private APIs, mark them clearly in tool descriptions and README so users know their stability profile.
8. Add targeted tests for live-docs supplemental modules using the current official path, method, version header, and required query/body fields.

## Full Machine-Readable Output

See \`${relative(repoRoot, jsonPath)}\` for the complete parsed endpoint lists.
`;
}

function formatEndpointList(endpoints) {
  if (endpoints.length === 0) return '- None found.';
  return endpoints
    .map((endpoint) => {
      const source = endpoint.sourceFile ?? endpoint.sourceFile;
      const extra = endpoint.summary || endpoint.operationId || endpoint.caller || '';
      return `- \`${endpoint.method} ${endpoint.path}\` — ${endpoint.app ?? endpoint.sourceFile}${extra ? ` — ${extra}` : ''}${source && endpoint.app ? ` (\`${source}\`)` : ''}`;
    })
    .join('\n');
}
