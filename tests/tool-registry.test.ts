import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ToolRegistry } from '../src/tool-registry.js';

const mockClient = {
  getConfig: () => ({
    accessToken: 'test',
    baseUrl: 'https://test.leadconnectorhq.com',
    version: '2021-07-28',
    locationId: 'test_location_123',
  }),
  makeRequest: async () => ({ success: true, data: {} }),
};

describe('ToolRegistry profiles', () => {
  const previousProfile = process.env.GHL_TOOL_PROFILE;

  beforeEach(() => {
    delete process.env.GHL_TOOL_PROFILE;
  });

  afterEach(() => {
    if (previousProfile === undefined) {
      delete process.env.GHL_TOOL_PROFILE;
    } else {
      process.env.GHL_TOOL_PROFILE = previousProfile;
    }
  });

  it('defaults to full profile with raw and curated tools', () => {
    const registry = new ToolRegistry(mockClient as any);

    expect(registry.getToolProfile()).toBe('full');
    expect(registry.getAllToolNames()).toContain('search_contacts');
    expect(registry.getAllToolNames()).toContain('crm_prepare_lead_intake');
    expect(registry.getToolCount()).toBe(registry.getAllToolDefinitions().length);
  });

  it('can expose only curated agent workspace tools', async () => {
    process.env.GHL_TOOL_PROFILE = 'curated';
    const registry = new ToolRegistry(mockClient as any);
    const names = registry.getAllToolNames();

    expect(registry.getToolProfile()).toBe('curated');
    expect(names).toContain('crm_prepare_lead_intake');
    expect(names).toContain('crm_prepare_appointment_booking');
    expect(names).not.toContain('search_contacts');
    expect(await registry.callTool('search_contacts', {})).toBeUndefined();
    expect(await registry.callTool('crm_list_workspaces', {})).toBeDefined();
  });

  it('can expose only raw endpoint-level tools', () => {
    process.env.GHL_TOOL_PROFILE = 'raw';
    const registry = new ToolRegistry(mockClient as any);
    const names = registry.getAllToolNames();

    expect(registry.getToolProfile()).toBe('raw');
    expect(names).toContain('search_contacts');
    expect(names).not.toContain('crm_prepare_lead_intake');
  });

  it('can expose only explicit official and live-docs supplemental tools', () => {
    process.env.GHL_TOOL_PROFILE = 'official';
    const registry = new ToolRegistry(mockClient as any);
    const inventory = registry.getToolInventory();
    const names = inventory.map((tool) => tool.name);

    expect(registry.getToolProfile()).toBe('official');
    expect(names).toContain('official_ad_manager_fb_get_reporting');
    expect(names).toContain('create_email_campaign_v2');
    expect(names).not.toContain('search_contacts');
    expect(inventory.every((tool) => ['official', 'live-docs-supplemental'].includes(tool.stability))).toBe(true);
  });

  it('can expose stable tools while hiding deprecated and private/unstable surfaces', () => {
    process.env.GHL_TOOL_PROFILE = 'stable';
    const registry = new ToolRegistry(mockClient as any);
    const inventory = registry.getToolInventory();
    const names = inventory.map((tool) => tool.name);

    expect(registry.getToolProfile()).toBe('stable');
    expect(names).toContain('search_contacts');
    expect(names).toContain('official_ad_manager_fb_get_reporting');
    expect(names).toContain('crm_prepare_lead_intake');
    expect(inventory.some((tool) => tool.stability === 'deprecated')).toBe(false);
    expect(inventory.some((tool) => tool.stability === 'private-or-unstable')).toBe(false);
  });
});
