import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(__dirname, '..', '..');

describe('GHL API coverage generation', () => {
  it('hardens the official docs checkout and carries live-docs supplemental endpoints', () => {
    const source = readFileSync(join(repoRoot, 'scripts', 'scan-ghl-api-coverage.mjs'), 'utf8');

    expect(source).toContain('https://github.com/GoHighLevel/highlevel-api-docs.git');
    expect(source).toContain('isExpectedDocsRepo');
    expect(source).toContain('normalizeGitUrl');
    expect(source).toContain('rmSync');
    expect(source).toContain('live-docs:ghl/emails/create-email-campaign-v-2');
    expect(source).toContain('live-docs:ghl/emails/create-email-template-v-2');
    expect(source).toContain('live-docs:ghl/emails/get-campaign-stats-under-campaigns-v-2');
  });

  it('reports exactly the June 10 2026 live-docs supplemental Email V2 endpoints', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const supplemental = coverage.official.endpoints.filter((endpoint: any) => endpoint.sourceFile?.startsWith('live-docs:'));

    expect(supplemental).toHaveLength(14);
    expect(new Set(supplemental.map((endpoint: any) => `${endpoint.method} ${endpoint.path}`))).toEqual(new Set([
      'POST /emails/public/v2/locations/{locationId}/campaigns/email-campaign',
      'GET /emails/public/v2/locations/{locationId}/campaigns/emails',
      'PATCH /emails/public/v2/locations/{locationId}/campaigns/{campaignId}',
      'DELETE /emails/public/v2/locations/{locationId}/campaigns/{campaignId}',
      'GET /emails/public/v2/locations/{locationId}/campaigns/workflows',
      'GET /emails/public/v2/locations/{locationId}/campaigns/bulk-actions',
      'POST /emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule',
      'POST /emails/public/v2/locations/{locationId}/templates',
      'GET /emails/public/v2/locations/{locationId}/templates',
      'POST /emails/public/v2/locations/{locationId}/templates/import',
      'POST /emails/public/v2/locations/{locationId}/templates/folders',
      'DELETE /emails/public/v2/locations/{locationId}/templates/{templateId}',
      'PATCH /emails/public/v2/locations/{locationId}/templates/{templateId}',
      'GET /emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}',
    ]));
  });

  it('keeps the API source lock consistent with generated coverage', () => {
    const coverage = JSON.parse(readFileSync(join(repoRoot, 'docs', 'ghl-api-coverage.json'), 'utf8'));
    const lock = JSON.parse(readFileSync(join(repoRoot, 'docs', 'api-sources.lock.json'), 'utf8'));
    const supplemental = coverage.official.endpoints.filter((endpoint: any) => endpoint.sourceFile?.startsWith('live-docs:'));

    expect(lock.verifiedDate).toBe('2026-06-10');
    expect(lock.primaryApiVersion).toBe('2023-02-21');
    expect(lock.officialDocs.commit).toBe(coverage.official.commit);
    expect(lock.officialDocs.expectedEndpointReferences).toBe(coverage.official.endpoints.length);
    expect(lock.liveDocsSupplemental.expectedEndpointReferences).toBe(supplemental.length);
    expect(lock.acceptance).toMatchObject({
      expectedMissingOfficialEndpoints: 0,
      expectedCoveragePercent: 100,
    });
  });

  it('generates official-spec tools for supplemental Templates V2 and Statistics V2 pages', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const byName = new Map(endpoints.map((endpoint: any) => [endpoint.name, endpoint]));

    expect(byName.get('official_emails_create_email_template_v2')).toMatchObject({
      method: 'POST',
      path: '/emails/public/v2/locations/{locationId}/templates',
    });
    expect(byName.get('official_emails_list_email_templates_v2')).toMatchObject({
      method: 'GET',
      path: '/emails/public/v2/locations/{locationId}/templates',
    });
    expect(byName.get('official_emails_get_campaign_stats_v2')).toMatchObject({
      method: 'GET',
      path: '/emails/public/v2/locations/{locationId}/campaigns/stats/{source}/{sourceId}',
      source: 'live-ghl-docs',
      stability: 'live-docs-supplemental',
    });
  });

  it('keeps generated official-spec tool names within custom tool limits without renaming valid stable names', () => {
    const endpoints = JSON.parse(readFileSync(join(repoRoot, 'src', 'tools', 'official-spec-endpoints.json'), 'utf8'));
    const names = endpoints.map((endpoint: any) => endpoint.name);

    expect(names.every((name: string) => name.length <= 64)).toBe(true);
    expect(names).toContain('official_ad_manager_fb_get_reporting');
    expect(names).not.toContain('official_payments_custom_provider_marketplace_app_update_capabilities');
    expect(names).toContain('official_payments_custom_provider_marketplace_app_update_9a8c6e');
  });

  it('keeps local-only endpoint classification aligned with the audit categories', () => {
    const report = readFileSync(join(repoRoot, 'docs', 'GHL-LOCAL-ENDPOINT-CLASSIFICATION.md'), 'utf8');

    expect(report).toContain('## Official But Scanner-Missed Candidates');
    expect(report).toContain('## Live-Docs Supplemental Candidates');
    expect(report).toContain('## Legacy But Still Useful');
    expect(report).toContain('## Private/Internal And Unstable');
    expect(report).toContain('## Deprecated Or Compatibility Aliases');
    expect(report).toContain('## Needs Manual Review');
  });
});
