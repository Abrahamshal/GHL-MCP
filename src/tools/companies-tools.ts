/**
 * GoHighLevel Companies Tools
 * Tools for managing company records (B2B CRM functionality)
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class CompaniesTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'get_companies',
        description: 'Get all companies for a location. Companies represent business entities in B2B scenarios.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip for pagination'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of companies to return'
            },
            query: {
              type: 'string',
              description: 'Search query to filter companies'
            }
          }
        },
        _meta: {
          labels: {
            category: "general",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_company',
        description: 'Get a specific company by ID',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'The company ID to retrieve'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
          },
          required: ['companyId']
        },
        _meta: {
          labels: {
            category: "general",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_company',
        description: 'Create a new company record',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            name: {
              type: 'string',
              description: 'Company name'
            },
            phone: {
              type: 'string',
              description: 'Company phone number'
            },
            email: {
              type: 'string',
              description: 'Company email address'
            },
            website: {
              type: 'string',
              description: 'Company website URL'
            },
            address1: {
              type: 'string',
              description: 'Street address line 1'
            },
            address2: {
              type: 'string',
              description: 'Street address line 2'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State/Province'
            },
            postalCode: {
              type: 'string',
              description: 'Postal/ZIP code'
            },
            country: {
              type: 'string',
              description: 'Country'
            },
            industry: {
              type: 'string',
              description: 'Industry/vertical'
            },
            employeeCount: {
              type: 'number',
              description: 'Number of employees'
            },
            annualRevenue: {
              type: 'number',
              description: 'Annual revenue'
            },
            description: {
              type: 'string',
              description: 'Company description'
            },
            customFields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  key: { type: 'string' },
                  value: { type: 'string' }
                },
              },
              description: 'Custom field values'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags to apply to the company'
            }
          },
          required: ['name']
        },
        _meta: {
          labels: {
            category: "general",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_company',
        description: 'Update an existing company record',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'The company ID to update'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            name: {
              type: 'string',
              description: 'Company name'
            },
            phone: {
              type: 'string',
              description: 'Company phone number'
            },
            email: {
              type: 'string',
              description: 'Company email address'
            },
            website: {
              type: 'string',
              description: 'Company website URL'
            },
            address1: {
              type: 'string',
              description: 'Street address line 1'
            },
            city: {
              type: 'string',
              description: 'City'
            },
            state: {
              type: 'string',
              description: 'State/Province'
            },
            postalCode: {
              type: 'string',
              description: 'Postal/ZIP code'
            },
            country: {
              type: 'string',
              description: 'Country'
            },
            industry: {
              type: 'string',
              description: 'Industry/vertical'
            },
            employeeCount: {
              type: 'number',
              description: 'Number of employees'
            },
            annualRevenue: {
              type: 'number',
              description: 'Annual revenue'
            },
            description: {
              type: 'string',
              description: 'Company description'
            },
            customFields: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  key: { type: 'string' },
                  value: { type: 'string' }
                },
              },
              description: 'Custom field values'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags to apply to the company'
            }
          },
          required: ['companyId']
        },
        _meta: {
          labels: {
            category: "general",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_company',
        description: 'Delete a company record',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'The company ID to delete'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
          },
          required: ['companyId']
        },
        _meta: {
          labels: {
            category: "general",
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
      case 'get_companies': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.query) params.append('query', String(args.query));
        
        return this.ghlClient.makeRequest('GET', `/companies/?${params.toString()}`);
      }

      case 'get_company': {
        const companyId = args.companyId as string;
        return this.ghlClient.makeRequest('GET', `/companies/${companyId}`);
      }

      case 'create_company': {
        const body: Record<string, unknown> = {
          locationId,
          name: args.name
        };
        const optionalFields = ['phone', 'email', 'website', 'address1', 'address2', 'city', 'state', 'postalCode', 'country', 'industry', 'employeeCount', 'annualRevenue', 'description', 'customFields', 'tags'];
        optionalFields.forEach(field => {
          if (args[field] !== undefined) body[field] = args[field];
        });
        
        return this.ghlClient.makeRequest('POST', `/companies/`, body);
      }

      case 'update_company': {
        const companyId = args.companyId as string;
        const body: Record<string, unknown> = {};
        const optionalFields = ['name', 'phone', 'email', 'website', 'address1', 'address2', 'city', 'state', 'postalCode', 'country', 'industry', 'employeeCount', 'annualRevenue', 'description', 'customFields', 'tags'];
        optionalFields.forEach(field => {
          if (args[field] !== undefined) body[field] = args[field];
        });
        
        return this.ghlClient.makeRequest('PUT', `/companies/${companyId}`, body);
      }

      case 'delete_company': {
        const companyId = args.companyId as string;
        return this.ghlClient.makeRequest('DELETE', `/companies/${companyId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
