import { describe, expect, it } from '@jest/globals';
import { spawnSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');
const cli = join(repoRoot, 'scripts', 'ghl-mcp.mjs');

function runCli(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: repoRoot,
    env: {
      ...process.env,
      GHL_API_KEY: '',
      GHL_LOCATION_ID: '',
      ...env,
    },
    encoding: 'utf8',
  });
}

describe('ghl-mcp onboarding CLI', () => {
  it('emits machine-readable doctor status with human next steps', () => {
    const result = runCli(['doctor', '--json']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.status).toBe('needsHumanAction');
    expect(payload.summary.needsHumanAction).toBeGreaterThanOrEqual(2);
    expect(payload.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'GHL_API_KEY',
          ok: false,
          nextStep: expect.stringContaining('.env'),
        }),
        expect.objectContaining({
          name: 'GHL_LOCATION_ID',
          ok: false,
          nextStep: expect.stringContaining('Location ID'),
        }),
      ])
    );
  });

  it('generates curated-profile client config with absolute server path', () => {
    const result = runCli(['configure', 'claude', '--profile', 'curated', '--json']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    const server = payload.config.mcpServers.ghl;
    expect(payload.client).toBe('claude');
    expect(payload.profile).toBe('curated');
    expect(server.args[0]).toBe(join(repoRoot, 'dist', 'server.js'));
    expect(server.env).toMatchObject({
      GHL_API_VERSION: '2023-02-21',
      GHL_TOOL_PROFILE: 'curated',
    });
  });

  it('runs agent-check without credentials and reports needs-human-action instead of failing setup', () => {
    const reportPath = join(repoRoot, 'SETUP_STATUS.md');
    if (existsSync(reportPath)) rmSync(reportPath);

    const result = runCli(['agent-check', '--skip-tests', '--no-network', '--json', '--write-report']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.status).toBe('needsHumanAction');
    expect(payload.safety.destructiveToolsRun).toBe(false);
    expect(payload.auth.status).toBe('skipped');
    expect(payload.config.client).toBe('codex');
    expect(existsSync(reportPath)).toBe(true);

    rmSync(reportPath);
  }, 30000);
});
