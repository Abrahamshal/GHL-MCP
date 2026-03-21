/**
 * GoHighLevel Links (Trigger Links) Tools
 * Tools for managing trigger links and link tracking
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class LinksTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'get_links',
        description: 'Get all trigger links for a location. Trigger links are trackable URLs that can trigger automations.',
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
              description: 'Maximum number of links to return'
            }
          }
        },
        _meta: {
          labels: {
            category: "links",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_link',
        description: 'Get a specific trigger link by ID',
        inputSchema: {
          type: 'object',
          properties: {
            linkId: {
              type: 'string',
              description: 'The link ID to retrieve'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
          },
          required: ['linkId']
        },
        _meta: {
          labels: {
            category: "links",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_link',
        description: 'Create a new trigger link',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            name: {
              type: 'string',
              description: 'Link name for identification'
            },
            redirectTo: {
              type: 'string',
              description: 'Target URL to redirect to when clicked'
            },
            fieldKey: {
              type: 'string',
              description: 'Custom field key to update on click'
            },
            fieldValue: {
              type: 'string',
              description: 'Value to set for the custom field'
            },
          },
          required: ['name', 'redirectTo']
        },
        _meta: {
          labels: {
            category: "links",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'update_link',
        description: 'Update an existing trigger link',
        inputSchema: {
          type: 'object',
          properties: {
            linkId: {
              type: 'string',
              description: 'The link ID to update'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            name: {
              type: 'string',
              description: 'Link name for identification'
            },
            redirectTo: {
              type: 'string',
              description: 'Target URL to redirect to when clicked'
            },
            fieldKey: {
              type: 'string',
              description: 'Custom field key to update on click'
            },
            fieldValue: {
              type: 'string',
              description: 'Value to set for the custom field'
            },
          },
          required: ['linkId']
        },
        _meta: {
          labels: {
            category: "links",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_link',
        description: 'Delete a trigger link',
        inputSchema: {
          type: 'object',
          properties: {
            linkId: {
              type: 'string',
              description: 'The link ID to delete'
            },
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
          },
          required: ['linkId']
        },
        _meta: {
          labels: {
            category: "links",
            access: "delete",
            complexity: "simple"
          }
        }
      },
      {
        name: 'search_links',
        description: 'Search trigger links by name or query string within a location',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            query: {
              type: 'string',
              description: 'Search term to filter links by name'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip for pagination'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of links to return'
            }
          }
        },
        _meta: {
          labels: {
            category: "links",
            access: "read",
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
      case 'get_links': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));
        
        return this.ghlClient.makeRequest('GET', `/links/?${params.toString()}`);
      }

      case 'get_link': {
        const linkId = args.linkId as string;
        return this.ghlClient.makeRequest('GET', `/links/${linkId}?locationId=${locationId}`);
      }

      case 'create_link': {
        const body: Record<string, unknown> = {
          locationId,
          name: args.name,
          redirectTo: args.redirectTo
        };
        if (args.fieldKey) body.fieldKey = args.fieldKey;
        if (args.fieldValue) body.fieldValue = args.fieldValue;
        
        return this.ghlClient.makeRequest('POST', `/links/`, body);
      }

      case 'update_link': {
        const linkId = args.linkId as string;
        const body: Record<string, unknown> = { locationId };
        if (args.name) body.name = args.name;
        if (args.redirectTo) body.redirectTo = args.redirectTo;
        if (args.fieldKey) body.fieldKey = args.fieldKey;
        if (args.fieldValue) body.fieldValue = args.fieldValue;
        
        return this.ghlClient.makeRequest('PUT', `/links/${linkId}`, body);
      }

      case 'delete_link': {
        const linkId = args.linkId as string;
        return this.ghlClient.makeRequest('DELETE', `/links/${linkId}?locationId=${locationId}`);
      }

      case 'search_links': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.query) params.append('query', String(args.query));
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));

        return this.ghlClient.makeRequest('GET', `/links/search?${params.toString()}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
