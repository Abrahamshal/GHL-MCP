import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EmailTools } from '../../src/tools/email-tools.js';

describe('EmailTools Email Campaign V2', () => {
  let emailTools: EmailTools;
  let makeRequest: jest.Mock;

  beforeEach(() => {
    makeRequest = jest.fn(async () => ({ success: true, data: { ok: true } }));
    emailTools = new EmailTools({
      getConfig: () => ({
        accessToken: 'test',
        baseUrl: 'https://services.leadconnectorhq.com',
        version: '2023-02-21',
        locationId: 'test_location_123',
      }),
      makeRequest,
      getEmailCampaigns: jest.fn(),
      createEmailTemplate: jest.fn(),
      getEmailTemplates: jest.fn(),
      updateEmailTemplate: jest.fn(),
      deleteEmailTemplate: jest.fn(),
    } as any);
  });

  it('exposes first-class live-docs Email Campaign V2 tools with official paths', () => {
    const tools = emailTools.getToolDefinitions();
    const byName = new Map(tools.map((tool) => [tool.name, tool as any]));

    expect(byName.get('create_email_campaign_v2')?._meta.official).toMatchObject({
      method: 'POST',
      path: '/emails/public/v2/locations/{locationId}/campaigns/email-campaign',
    });
    expect(byName.get('list_email_campaigns_v2')?._meta.official.path).toBe('/emails/public/v2/locations/{locationId}/campaigns/emails');
    expect(byName.get('update_email_campaign_v2')?._meta.official.method).toBe('PATCH');
    expect(byName.get('delete_email_campaign_v2')?._meta.official.method).toBe('DELETE');
    expect(byName.get('list_workflow_campaigns_v2')?._meta.official.path).toBe('/emails/public/v2/locations/{locationId}/campaigns/workflows');
    expect(byName.get('list_bulk_action_campaigns_v2')?._meta.official.path).toBe('/emails/public/v2/locations/{locationId}/campaigns/bulk-actions');
    expect(byName.get('schedule_email_campaign_v2')?._meta.official.path).toBe('/emails/public/v2/locations/{locationId}/campaigns/{campaignId}/schedule');
  });

  it('creates campaigns through the Email Campaign V2 live-docs path', async () => {
    await emailTools.executeTool('create_email_campaign_v2', {
      body: { name: 'June Launch', subject: 'Hello' },
    });

    expect(makeRequest).toHaveBeenCalledWith(
      'POST',
      '/emails/public/v2/locations/test_location_123/campaigns/email-campaign',
      { name: 'June Launch', subject: 'Hello' },
    );
  });

  it('lists campaign, workflow, and bulk-action campaigns with query parameters', async () => {
    await emailTools.executeTool('list_email_campaigns_v2', { limit: 25, status: 'draft' });
    await emailTools.executeTool('list_workflow_campaigns_v2', { offset: 5 });
    await emailTools.executeTool('list_bulk_action_campaigns_v2', {});

    expect(makeRequest).toHaveBeenNthCalledWith(
      1,
      'GET',
      '/emails/public/v2/locations/test_location_123/campaigns/emails?limit=25&status=draft',
    );
    expect(makeRequest).toHaveBeenNthCalledWith(
      2,
      'GET',
      '/emails/public/v2/locations/test_location_123/campaigns/workflows?offset=5',
    );
    expect(makeRequest).toHaveBeenNthCalledWith(
      3,
      'GET',
      '/emails/public/v2/locations/test_location_123/campaigns/bulk-actions',
    );
  });

  it('updates, deletes, and schedules campaigns using encoded campaign IDs', async () => {
    await emailTools.executeTool('update_email_campaign_v2', {
      campaignId: 'campaign 123',
      name: 'Updated Campaign',
    });
    await emailTools.executeTool('delete_email_campaign_v2', { campaignId: 'campaign 123' });
    await emailTools.executeTool('schedule_email_campaign_v2', {
      campaignId: 'campaign 123',
      payload: { type: 'schedule', scheduledDate: '2026-06-10T16:00:00Z' },
    });

    expect(makeRequest).toHaveBeenNthCalledWith(
      1,
      'PATCH',
      '/emails/public/v2/locations/test_location_123/campaigns/campaign%20123',
      { name: 'Updated Campaign' },
    );
    expect(makeRequest).toHaveBeenNthCalledWith(
      2,
      'DELETE',
      '/emails/public/v2/locations/test_location_123/campaigns/campaign%20123',
    );
    expect(makeRequest).toHaveBeenNthCalledWith(
      3,
      'POST',
      '/emails/public/v2/locations/test_location_123/campaigns/campaign%20123/schedule',
      { type: 'schedule', scheduledDate: '2026-06-10T16:00:00Z' },
    );
  });
});
