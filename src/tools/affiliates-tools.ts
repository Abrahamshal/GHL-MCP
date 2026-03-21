/**
 * GoHighLevel Affiliates Tools
 * Tools for managing affiliate marketing program
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class AffiliatesTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      // Affiliate Campaigns
      {
        name: 'get_affiliate_campaigns',
        description: 'Get all affiliate campaigns',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            status: { type: 'string', enum: ['active', 'inactive', 'all'], description: 'Campaign status filter' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' }
          }
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_affiliate_campaign',
        description: 'Get a specific affiliate campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Affiliate Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_affiliate_campaign',
        description: 'Create a new affiliate campaign',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Campaign name' },
            description: { type: 'string', description: 'Campaign description' },
            commissionType: { type: 'string', enum: ['percentage', 'fixed'], description: 'Commission type' },
            commissionValue: { type: 'number', description: 'Commission value (percentage or fixed amount)' },
            cookieDays: { type: 'number', description: 'Cookie tracking duration in days' },
            productIds: { type: 'array', items: { type: 'string' }, description: 'Product IDs for this campaign' },
          },
          required: ['name', 'commissionType', 'commissionValue']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_affiliate_campaign',
        description: 'Update an affiliate campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'Campaign name' },
            description: { type: 'string', description: 'Campaign description' },
            commissionType: { type: 'string', enum: ['percentage', 'fixed'], description: 'Commission type' },
            commissionValue: { type: 'number', description: 'Commission value' },
            status: { type: 'string', enum: ['active', 'inactive'], description: 'Campaign status' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_affiliate_campaign',
        description: 'Delete an affiliate campaign',
        inputSchema: {
          type: 'object',
          properties: {
            campaignId: { type: 'string', description: 'Campaign ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['campaignId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Affiliates
      {
        name: 'get_affiliates',
        description: 'Get all affiliates',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            campaignId: { type: 'string', description: 'Filter by campaign' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], description: 'Status filter' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' }
          }
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_affiliate',
        description: 'Get a specific affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_affiliate',
        description: 'Create/add a new affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            contactId: { type: 'string', description: 'Contact ID to make affiliate' },
            campaignId: { type: 'string', description: 'Campaign to assign to' },
            customCode: { type: 'string', description: 'Custom affiliate code' },
            status: { type: 'string', enum: ['pending', 'approved'], description: 'Initial status' },
          },
          required: ['contactId', 'campaignId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_affiliate',
        description: 'Update an affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'], description: 'Status' },
            customCode: { type: 'string', description: 'Custom affiliate code' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'approve_affiliate',
        description: 'Approve a pending affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'reject_affiliate',
        description: 'Reject/deny a pending affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
            reason: { type: 'string', description: 'Rejection reason' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_affiliate',
        description: 'Remove an affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // Commissions & Payouts
      {
        name: 'get_affiliate_commissions',
        description: 'Get commissions for an affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
            status: { type: 'string', enum: ['pending', 'approved', 'paid', 'all'], description: 'Status filter' },
            startDate: { type: 'string', description: 'Start date' },
            endDate: { type: 'string', description: 'End date' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_affiliate_stats',
        description: 'Get affiliate performance statistics',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
            startDate: { type: 'string', description: 'Start date' },
            endDate: { type: 'string', description: 'End date' },
          },
          required: ['affiliateId']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_payout',
        description: 'Create a payout for affiliate',
        inputSchema: {
          type: 'object',
          properties: {
            affiliateId: { type: 'string', description: 'Affiliate ID' },
            locationId: { type: 'string', description: 'Location ID' },
            amount: { type: 'number', description: 'Payout amount' },
            commissionIds: { type: 'array', items: { type: 'string' }, description: 'Commission IDs to include' },
            note: { type: 'string', description: 'Payout note' },
          },
          required: ['affiliateId', 'amount']
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_payouts',
        description: 'Get affiliate payouts',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            affiliateId: { type: 'string', description: 'Filter by affiliate' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'all'], description: 'Status filter' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' }
          }
        },
        _meta: {
          labels: {
            category: "affiliates",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Referrals
      {
        name: 'get_referrals',
        description: 'Get referrals (leads/sales) from affiliates',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            affiliateId: { type: 'string', description: 'Filter by affiliate' },
            campaignId: { type: 'string', description: 'Filter by campaign' },
            type: { type: 'string', enum: ['lead', 'sale', 'all'], description: 'Referral type' },
            limit: { type: 'number', description: 'Max results' },
            offset: { type: 'number', description: 'Pagination offset' }
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      // Campaigns
      case 'get_affiliate_campaigns': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.status) params.append('status', String(args.status));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/affiliates/campaigns?${params.toString()}`);
      }
      case 'get_affiliate_campaign': {
        return this.ghlClient.makeRequest('GET', `/affiliates/campaigns/${args.campaignId}?locationId=${locationId}`);
      }
      case 'create_affiliate_campaign': {
        return this.ghlClient.makeRequest('POST', `/affiliates/campaigns`, {
          locationId,
          name: args.name,
          description: args.description,
          commissionType: args.commissionType,
          commissionValue: args.commissionValue,
          cookieDays: args.cookieDays,
          productIds: args.productIds
        });
      }
      case 'update_affiliate_campaign': {
        const body: Record<string, unknown> = { locationId };
        if (args.name) body.name = args.name;
        if (args.description) body.description = args.description;
        if (args.commissionType) body.commissionType = args.commissionType;
        if (args.commissionValue) body.commissionValue = args.commissionValue;
        if (args.status) body.status = args.status;
        return this.ghlClient.makeRequest('PUT', `/affiliates/campaigns/${args.campaignId}`, body);
      }
      case 'delete_affiliate_campaign': {
        return this.ghlClient.makeRequest('DELETE', `/affiliates/campaigns/${args.campaignId}?locationId=${locationId}`);
      }

      // Affiliates
      case 'get_affiliates': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.campaignId) params.append('campaignId', String(args.campaignId));
        if (args.status) params.append('status', String(args.status));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/affiliates/?${params.toString()}`);
      }
      case 'get_affiliate': {
        return this.ghlClient.makeRequest('GET', `/affiliates/${args.affiliateId}?locationId=${locationId}`);
      }
      case 'create_affiliate': {
        return this.ghlClient.makeRequest('POST', `/affiliates/`, {
          locationId,
          contactId: args.contactId,
          campaignId: args.campaignId,
          customCode: args.customCode,
          status: args.status
        });
      }
      case 'update_affiliate': {
        const body: Record<string, unknown> = { locationId };
        if (args.status) body.status = args.status;
        if (args.customCode) body.customCode = args.customCode;
        return this.ghlClient.makeRequest('PUT', `/affiliates/${args.affiliateId}`, body);
      }
      case 'approve_affiliate': {
        return this.ghlClient.makeRequest('POST', `/affiliates/${args.affiliateId}/approve`, { locationId });
      }
      case 'reject_affiliate': {
        return this.ghlClient.makeRequest('POST', `/affiliates/${args.affiliateId}/reject`, {
          locationId,
          reason: args.reason
        });
      }
      case 'delete_affiliate': {
        return this.ghlClient.makeRequest('DELETE', `/affiliates/${args.affiliateId}?locationId=${locationId}`);
      }

      // Commissions
      case 'get_affiliate_commissions': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.status) params.append('status', String(args.status));
        if (args.startDate) params.append('startDate', String(args.startDate));
        if (args.endDate) params.append('endDate', String(args.endDate));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/affiliates/${args.affiliateId}/commissions?${params.toString()}`);
      }
      case 'get_affiliate_stats': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.startDate) params.append('startDate', String(args.startDate));
        if (args.endDate) params.append('endDate', String(args.endDate));
        return this.ghlClient.makeRequest('GET', `/affiliates/${args.affiliateId}/stats?${params.toString()}`);
      }
      case 'create_payout': {
        return this.ghlClient.makeRequest('POST', `/affiliates/${args.affiliateId}/payouts`, {
          locationId,
          amount: args.amount,
          commissionIds: args.commissionIds,
          note: args.note
        });
      }
      case 'get_payouts': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.affiliateId) params.append('affiliateId', String(args.affiliateId));
        if (args.status) params.append('status', String(args.status));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/affiliates/payouts?${params.toString()}`);
      }

      // Referrals
      case 'get_referrals': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.affiliateId) params.append('affiliateId', String(args.affiliateId));
        if (args.campaignId) params.append('campaignId', String(args.campaignId));
        if (args.type) params.append('type', String(args.type));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.offset) params.append('offset', String(args.offset));
        return this.ghlClient.makeRequest('GET', `/affiliates/referrals?${params.toString()}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
