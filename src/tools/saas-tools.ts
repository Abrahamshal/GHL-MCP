/**
 * GoHighLevel SaaS/Agency Tools
 * Tools for agency-level operations (company/agency management)
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class SaasTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'get_saas_locations',
        description: 'Get all sub-accounts/locations for a SaaS agency. Requires agency-level access.',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of locations to return (default: 10, max: 100)'
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort order'
            },
            isActive: {
              type: 'boolean',
              description: 'Filter by active status'
            },
          },
          required: ['companyId']
        },
        _meta: {
          labels: {
            category: "saas",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_saas_location',
        description: 'Get a specific sub-account/location by ID at the agency level',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Location ID to retrieve'
            },
          },
          required: ['companyId', 'locationId']
        },
        _meta: {
          labels: {
            category: "saas",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_saas_subscription',
        description: 'Update SaaS subscription settings for a location',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Location ID'
            },
            subscriptionId: {
              type: 'string',
              description: 'Subscription ID'
            },
            status: {
              type: 'string',
              enum: ['active', 'paused', 'cancelled'],
              description: 'Subscription status'
            },
          },
          required: ['companyId', 'locationId']
        },
        _meta: {
          labels: {
            category: "saas",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'pause_saas_location',
        description: 'Pause a SaaS sub-account/location',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Location ID to pause'
            },
            paused: {
              type: 'boolean',
              description: 'Whether to pause (true) or unpause (false)'
            },
          },
          required: ['companyId', 'locationId', 'paused']
        },
        _meta: {
          labels: {
            category: "saas",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'enable_saas_location',
        description: 'Enable or disable SaaS features for a location',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Location ID'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether to enable (true) or disable (false) SaaS'
            },
          },
          required: ['companyId', 'locationId', 'enabled']
        },
        _meta: {
          labels: {
            category: "saas",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'rebilling_update',
        description: 'Update rebilling configuration for agency',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            product: {
              type: 'string',
              description: 'Product to configure rebilling for'
            },
            markup: {
              type: 'number',
              description: 'Markup percentage'
            },
            enabled: {
              type: 'boolean',
              description: 'Whether rebilling is enabled'
            },
          },
          required: ['companyId']
        },
        _meta: {
          labels: {
            category: "saas",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_saas_agency_plans',
        description: 'Get all SaaS plans available for the agency',
        _meta: {
          labels: { category: 'saas', access: 'read', complexity: 'simple' }
        },
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            }
          },
          required: ['companyId']
        }
      },
      {
        name: 'bulk_disable_saas',
        description: 'Disable SaaS for multiple locations in bulk',
        _meta: {
          labels: { category: 'saas', access: 'write', complexity: 'moderate' }
        },
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of location IDs to disable SaaS for'
            }
          },
          required: ['companyId', 'locationIds']
        }
      },
      {
        name: 'bulk_enable_saas',
        description: 'Enable SaaS for multiple locations in bulk',
        _meta: {
          labels: { category: 'saas', access: 'write', complexity: 'moderate' }
        },
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of location IDs to enable SaaS for'
            },
            planId: {
              type: 'string',
              description: 'SaaS plan ID to assign'
            }
          },
          required: ['companyId', 'locationIds']
        }
      },
      {
        name: 'get_saas_subscription',
        description: 'Get the SaaS subscription details for a specific location',
        _meta: {
          labels: { category: 'saas', access: 'read', complexity: 'simple' }
        },
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Location ID to retrieve subscription for'
            }
          },
          required: ['companyId', 'locationId']
        }
      },
      {
        name: 'list_saas_locations_by_company',
        description: 'List all SaaS-enabled locations under a company',
        _meta: {
          labels: { category: 'saas', access: 'read', complexity: 'simple' }
        },
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            limit: {
              type: 'number',
              description: 'Maximum records to return'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip'
            }
          },
          required: ['companyId']
        }
      },
      {
        name: 'get_saas_plan',
        description: 'Get details of a specific SaaS plan by plan ID',
        _meta: {
          labels: { category: 'saas', access: 'read', complexity: 'simple' }
        },
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            planId: {
              type: 'string',
              description: 'SaaS plan ID to retrieve'
            }
          },
          required: ['companyId', 'planId']
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const companyId = args.companyId as string;

    switch (toolName) {
      case 'get_saas_locations': {
        const params = new URLSearchParams();
        params.append('companyId', companyId);
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.order) params.append('order', String(args.order));
        if (args.isActive !== undefined) params.append('isActive', String(args.isActive));
        
        return this.ghlClient.makeRequest('GET', `/saas-api/public-api/locations?${params.toString()}`);
      }

      case 'get_saas_location': {
        const locationId = args.locationId as string;
        return this.ghlClient.makeRequest('GET', `/saas-api/public-api/locations/${locationId}?companyId=${companyId}`);
      }

      case 'update_saas_subscription': {
        const locationId = args.locationId as string;
        const body: Record<string, unknown> = { companyId };
        if (args.subscriptionId) body.subscriptionId = args.subscriptionId;
        if (args.status) body.status = args.status;
        
        return this.ghlClient.makeRequest('PUT', `/saas-api/public-api/locations/${locationId}/subscription`, body);
      }

      case 'pause_saas_location': {
        const locationId = args.locationId as string;
        return this.ghlClient.makeRequest('POST', `/saas-api/public-api/locations/${locationId}/pause`, {
          companyId,
          paused: args.paused
        });
      }

      case 'enable_saas_location': {
        const locationId = args.locationId as string;
        return this.ghlClient.makeRequest('POST', `/saas-api/public-api/locations/${locationId}/enable`, {
          companyId,
          enabled: args.enabled
        });
      }

      case 'rebilling_update': {
        const body: Record<string, unknown> = { companyId };
        if (args.product) body.product = args.product;
        if (args.markup !== undefined) body.markup = args.markup;
        if (args.enabled !== undefined) body.enabled = args.enabled;
        
        return this.ghlClient.makeRequest('PUT', `/saas-api/public-api/rebilling`, body);
      }

      case 'get_saas_agency_plans': {
        return this.ghlClient.makeRequest('GET', `/saas-api/public-api/plans?companyId=${companyId}`);
      }

      case 'bulk_disable_saas': {
        return this.ghlClient.makeRequest('POST', `/saas-api/public-api/locations/bulk-disable`, {
          companyId,
          locationIds: args.locationIds
        });
      }

      case 'bulk_enable_saas': {
        const body: Record<string, unknown> = { companyId, locationIds: args.locationIds };
        if (args.planId) body.planId = args.planId;
        return this.ghlClient.makeRequest('POST', `/saas-api/public-api/locations/bulk-enable`, body);
      }

      case 'get_saas_subscription': {
        const locationId = args.locationId as string;
        return this.ghlClient.makeRequest('GET', `/saas-api/public-api/locations/${locationId}/subscription?companyId=${companyId}`);
      }

      case 'list_saas_locations_by_company': {
        const params = new URLSearchParams({ companyId });
        if (args.limit) params.append('limit', String(args.limit));
        if (args.skip) params.append('skip', String(args.skip));
        return this.ghlClient.makeRequest('GET', `/saas-api/public-api/locations/by-company?${params.toString()}`);
      }

      case 'get_saas_plan': {
        const planId = args.planId as string;
        return this.ghlClient.makeRequest('GET', `/saas-api/public-api/plans/${planId}?companyId=${companyId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
