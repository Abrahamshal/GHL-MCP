#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const lockPath = join(repoRoot, 'docs', 'api-sources.lock.json');
const coveragePath = join(repoRoot, 'docs', 'ghl-api-coverage.json');

const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
const failures = [];

check(lock.schemaVersion === 1, 'api source lock schemaVersion must be 1');
check(lock.primaryApiVersion === '2023-02-21', 'primary API version must stay pinned to 2023-02-21');
check(lock.officialDocs?.repo === coverage.official?.repo, 'official docs repo mismatch');
check(lock.officialDocs?.commit === coverage.official?.commit, 'official docs commit mismatch');
check(lock.officialDocs?.tag === coverage.official?.tag, 'official docs tag mismatch');
check(lock.officialDocs?.expectedEndpointReferences === coverage.official?.endpoints?.length, 'official endpoint reference count mismatch');
check(lock.officialDocs?.expectedUniqueEndpoints === coverage.comparison?.officialUniqueCount, 'official unique endpoint count mismatch');
check(lock.acceptance?.expectedMissingOfficialEndpoints === coverage.comparison?.missingOfficial?.length, 'missing official endpoint count mismatch');
check(lock.acceptance?.expectedCoveragePercent === coverage.comparison?.coveragePercent, 'coverage percent mismatch');

const supplemental = coverage.official.endpoints.filter((endpoint) => endpoint.sourceFile?.startsWith('live-docs:'));
check(lock.liveDocsSupplemental?.expectedEndpointReferences === supplemental.length, 'live-docs supplemental count mismatch');

const lockedSupplemental = new Set((lock.liveDocsSupplemental?.endpoints || []).map(endpointKey));
const actualSupplemental = new Set(supplemental.map(endpointKey));
check(setsEqual(lockedSupplemental, actualSupplemental), 'live-docs supplemental endpoint set mismatch');

if (failures.length) {
  console.error('API source lock validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('API source lock is consistent with coverage artifacts.');

function check(condition, message) {
  if (!condition) failures.push(message);
}

function endpointKey(endpoint) {
  return `${endpoint.method} ${endpoint.path}`;
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
