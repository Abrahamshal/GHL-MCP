/**
 * GoHighLevel Marketplace & Billing Tools
 * Tools for managing marketplace app installations and wallet billing charges
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class MarketplaceTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'list_marketplace_installations',
        description: 'Get installer details for a specific app. Fetches information about the company, location, user, and installation details associated with the current OAuth token.',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'ID of the app to get installer details for'
            },
            isInstalled: {
              type: 'boolean',
              description: 'Filter by installation status'
            },
            companyId: {
              type: 'string',
              description: 'Company ID to filter installations'
            },
            locationId: {
              type: 'string',
              description: 'Location ID to filter installations (uses default if not provided)'
            },
            planId: {
              type: 'string',
              description: 'Plan ID to filter installations'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip for pagination'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return'
            }
          },
          required: ['appId']
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'delete_marketplace_installation',
        description: 'Uninstall an application from your company or a specific location. This will remove the application\'s access and stop all its functionalities.',
        inputSchema: {
          type: 'object',
          properties: {
            appId: {
              type: 'string',
              description: 'The application ID to uninstall'
            },
            locationId: {
              type: 'string',
              description: 'Location ID to uninstall from (uses default if not provided). If not provided, uninstalls from the company.'
            },
            companyId: {
              type: 'string',
              description: 'Company ID to uninstall from'
            }
          },
          required: ['appId']
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'delete',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'list_billing_charges',
        description: 'Get all wallet charges for a location. Returns a list of billing charges with details like amount, currency, meter ID, and transaction type.',
        inputSchema: {
          type: 'object',
          properties: {
            meterId: {
              type: 'string',
              description: 'Billing Meter ID (found on your app\'s pricing page on the developer portal)'
            },
            eventId: {
              type: 'string',
              description: 'Event ID / Transaction ID to filter by'
            },
            userId: {
              type: 'string',
              description: 'Filter results by User ID that your server passed via API when the charge was created'
            },
            startDate: {
              type: 'string',
              description: 'Filter results AFTER a specific date (e.g., "2025-03-26"). Use with endDate to filter a time window.'
            },
            endDate: {
              type: 'string',
              description: 'Filter results BEFORE a specific date (e.g., "2025-03-26"). Use with startDate to filter a time window.'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip for pagination'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return'
            }
          }
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'create_billing_charge',
        description: 'Create a new wallet charge for a location. Used to bill sub-accounts for usage-based features in your marketplace app.',
        inputSchema: {
          type: 'object',
          properties: {
            meterId: {
              type: 'string',
              description: 'Billing Meter ID (found on your app\'s pricing page on the developer portal)'
            },
            units: {
              type: 'number',
              description: 'Number of units to charge the sub-account for'
            },
            description: {
              type: 'string',
              description: 'Description of the charge'
            },
            eventId: {
              type: 'string',
              description: 'Unique event / transaction ID for idempotency'
            },
            eventTime: {
              type: 'string',
              description: 'Timestamp when the billable event occurred (ISO 8601)'
            },
            userId: {
              type: 'string',
              description: 'User ID associated with this charge'
            }
          },
          required: ['meterId', 'units']
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'write',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'check_billing_funds',
        description: 'Check if a location account has sufficient funds in its wallet for billing. Returns a boolean indicating fund availability.',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'get_billing_charge',
        description: 'Get specific wallet charge details by charge ID. Returns full charge information including amount, currency, meter ID, and metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            chargeId: {
              type: 'string',
              description: 'ID of the charge to retrieve'
            }
          },
          required: ['chargeId']
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'delete_billing_charge',
        description: 'Delete a wallet charge by charge ID. This removes/refunds the specified charge.',
        inputSchema: {
          type: 'object',
          properties: {
            chargeId: {
              type: 'string',
              description: 'ID of the charge to delete'
            }
          },
          required: ['chargeId']
        },
        _meta: {
          labels: {
            category: 'marketplace',
            access: 'delete',
            complexity: 'simple'
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      case 'list_marketplace_installations': {
        const appId = args.appId as string;
        const params = new URLSearchParams();
        if (args.isInstalled !== undefined) params.append('isInstalled', String(args.isInstalled));
        if (args.companyId) params.append('companyId', args.companyId as string);
        if (locationId) params.append('locationId', locationId);
        if (args.planId) params.append('planId', args.planId as string);
        if (args.skip !== undefined) params.append('skip', String(args.skip));
        if (args.limit !== undefined) params.append('limit', String(args.limit));
        const qs = params.toString();
        return this.ghlClient.makeRequest('GET', `/marketplace/app/${appId}/installations${qs ? `?${qs}` : ''}`);
      }

      case 'delete_marketplace_installation': {
        const appId = args.appId as string;
        const body: Record<string, unknown> = {};
        if (locationId) body.locationId = locationId;
        if (args.companyId) body.companyId = args.companyId;
        return this.ghlClient.makeRequest('DELETE', `/marketplace/app/${appId}/installations`, body);
      }

      case 'list_billing_charges': {
        const params = new URLSearchParams();
        if (args.meterId) params.append('meterId', args.meterId as string);
        if (args.eventId) params.append('eventId', args.eventId as string);
        if (args.userId) params.append('userId', args.userId as string);
        if (args.startDate) params.append('startDate', args.startDate as string);
        if (args.endDate) params.append('endDate', args.endDate as string);
        if (args.skip !== undefined) params.append('skip', String(args.skip));
        if (args.limit !== undefined) params.append('limit', String(args.limit));
        const qs = params.toString();
        return this.ghlClient.makeRequest('GET', `/marketplace/billing/charges${qs ? `?${qs}` : ''}`);
      }

      case 'create_billing_charge': {
        const body: Record<string, unknown> = {
          meterId: args.meterId,
          units: args.units
        };
        if (args.description) body.description = args.description;
        if (args.eventId) body.eventId = args.eventId;
        if (args.eventTime) body.eventTime = args.eventTime;
        if (args.userId) body.userId = args.userId;
        return this.ghlClient.makeRequest('POST', '/marketplace/billing/charges', body);
      }

      case 'check_billing_funds': {
        return this.ghlClient.makeRequest('GET', '/marketplace/billing/charges/has-funds');
      }

      case 'get_billing_charge': {
        const chargeId = args.chargeId as string;
        return this.ghlClient.makeRequest('GET', `/marketplace/billing/charges/${chargeId}`);
      }

      case 'delete_billing_charge': {
        const chargeId = args.chargeId as string;
        return this.ghlClient.makeRequest('DELETE', `/marketplace/billing/charges/${chargeId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
