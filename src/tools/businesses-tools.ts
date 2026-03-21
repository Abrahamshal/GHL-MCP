/**
 * GoHighLevel Businesses Tools
 * Tools for managing businesses (multi-business support)
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class BusinessesTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'get_businesses',
        description: 'Get all businesses for a location. Businesses represent different entities within a sub-account.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            }
          }
        },
        _meta: {
          labels: {
            category: "businesses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_business',
        description: 'Get a specific business by ID',
        inputSchema: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              description: 'The business ID to retrieve'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
          },
          required: ['businessId']
        },
        _meta: {
          labels: {
            category: "businesses",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_business',
        description: 'Create a new business for a location',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            name: {
              type: 'string',
              description: 'Business name'
            },
            phone: {
              type: 'string',
              description: 'Business phone number'
            },
            email: {
              type: 'string',
              description: 'Business email address'
            },
            website: {
              type: 'string',
              description: 'Business website URL'
            },
            address: {
              type: 'string',
              description: 'Business street address'
            },
            city: {
              type: 'string',
              description: 'Business city'
            },
            state: {
              type: 'string',
              description: 'Business state'
            },
            postalCode: {
              type: 'string',
              description: 'Business postal/zip code'
            },
            country: {
              type: 'string',
              description: 'Business country'
            },
            description: {
              type: 'string',
              description: 'Business description'
            },
            logoUrl: {
              type: 'string',
              description: 'URL to business logo image'
            },
          },
          required: ['name']
        },
        _meta: {
          labels: {
            category: "businesses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_business',
        description: 'Update an existing business',
        inputSchema: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              description: 'The business ID to update'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            name: {
              type: 'string',
              description: 'Business name'
            },
            phone: {
              type: 'string',
              description: 'Business phone number'
            },
            email: {
              type: 'string',
              description: 'Business email address'
            },
            website: {
              type: 'string',
              description: 'Business website URL'
            },
            address: {
              type: 'string',
              description: 'Business street address'
            },
            city: {
              type: 'string',
              description: 'Business city'
            },
            state: {
              type: 'string',
              description: 'Business state'
            },
            postalCode: {
              type: 'string',
              description: 'Business postal/zip code'
            },
            country: {
              type: 'string',
              description: 'Business country'
            },
            description: {
              type: 'string',
              description: 'Business description'
            },
            logoUrl: {
              type: 'string',
              description: 'URL to business logo image'
            },
          },
          required: ['businessId']
        },
        _meta: {
          labels: {
            category: "businesses",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_business',
        description: 'Delete a business from a location',
        inputSchema: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              description: 'The business ID to delete'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
          },
          required: ['businessId']
        },
        _meta: {
          labels: {
            category: "businesses",
            access: "delete",
            complexity: "simple"
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      case 'get_businesses': {
        return this.ghlClient.makeRequest('GET', `/businesses/?locationId=${locationId}`);
      }

      case 'get_business': {
        const businessId = args.businessId as string;
        return this.ghlClient.makeRequest('GET', `/businesses/${businessId}?locationId=${locationId}`);
      }

      case 'create_business': {
        const body: Record<string, unknown> = {
          locationId,
          name: args.name
        };
        const optionalFields = ['phone', 'email', 'website', 'address', 'city', 'state', 'postalCode', 'country', 'description', 'logoUrl'];
        optionalFields.forEach(field => {
          if (args[field]) body[field] = args[field];
        });
        
        return this.ghlClient.makeRequest('POST', `/businesses/`, body);
      }

      case 'update_business': {
        const businessId = args.businessId as string;
        const body: Record<string, unknown> = { locationId };
        const optionalFields = ['name', 'phone', 'email', 'website', 'address', 'city', 'state', 'postalCode', 'country', 'description', 'logoUrl'];
        optionalFields.forEach(field => {
          if (args[field]) body[field] = args[field];
        });
        
        return this.ghlClient.makeRequest('PUT', `/businesses/${businessId}`, body);
      }

      case 'delete_business': {
        const businessId = args.businessId as string;
        return this.ghlClient.makeRequest('DELETE', `/businesses/${businessId}?locationId=${locationId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
