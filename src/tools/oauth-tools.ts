/**
 * GoHighLevel OAuth/Auth Tools
 * Tools for managing OAuth apps, tokens, and integrations
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class OAuthTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      // OAuth Apps
      {
        name: 'get_oauth_apps',
        description: 'Get all OAuth applications/integrations for a location',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            companyId: { type: 'string', description: 'Company ID for agency-level apps' }
          }
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_oauth_app',
        description: 'Get a specific OAuth application by ID',
        inputSchema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'OAuth App ID' },
            locationId: { type: 'string', description: 'Location ID' }
          },
          required: ['appId']
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_installed_locations',
        description: 'Get all locations where an OAuth app is installed',
        inputSchema: {
          type: 'object',
          properties: {
            appId: { type: 'string', description: 'OAuth App ID' },
            companyId: { type: 'string', description: 'Company ID' },
            skip: { type: 'number', description: 'Records to skip' },
            limit: { type: 'number', description: 'Max results' },
            query: { type: 'string', description: 'Search query' },
            isInstalled: { type: 'boolean', description: 'Filter by installation status' }
          },
          required: ['appId', 'companyId']
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Access Tokens
      {
        name: 'get_access_token_info',
        description: 'Get information about the current access token',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_location_access_token',
        description: 'Get an access token for a specific location (agency use)',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: { type: 'string', description: 'Company/Agency ID' },
            locationId: { type: 'string', description: 'Target Location ID' }
          },
          required: ['companyId', 'locationId']
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // Connected Integrations
      {
        name: 'get_connected_integrations',
        description: 'Get all connected third-party integrations for a location',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' }
          }
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'disconnect_integration',
        description: 'Disconnect a third-party integration',
        inputSchema: {
          type: 'object',
          properties: {
            integrationId: { type: 'string', description: 'Integration ID to disconnect' },
            locationId: { type: 'string', description: 'Location ID' }
          },
          required: ['integrationId']
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "delete",
            complexity: "simple"
          }
        }
      },

      // API Keys
      {
        name: 'get_api_keys',
        description: 'List all API keys for a location',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' }
          }
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_api_key',
        description: 'Create a new API key',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: { type: 'string', description: 'Location ID' },
            name: { type: 'string', description: 'API key name/label' },
            scopes: { 
              type: 'array', 
              items: { type: 'string' },
              description: 'Permission scopes for the key'
            }
          },
          required: ['name']
        },
        _meta: {
          labels: {
            category: "oauth",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'delete_api_key',
        description: 'Delete/revoke an API key',
        inputSchema: {
          type: 'object',
          properties: {
            keyId: { type: 'string', description: 'API Key ID' },
            locationId: { type: 'string', description: 'Location ID' }
          },
          required: ['keyId']
        },
        _meta: {
          labels: {
            category: "oauth",
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
      case 'get_oauth_apps': {
        const params = new URLSearchParams();
        if (locationId) params.append('locationId', locationId);
        if (args.companyId) params.append('companyId', String(args.companyId));
        return this.ghlClient.makeRequest('GET', `/oauth/apps?${params.toString()}`);
      }
      case 'get_oauth_app': {
        return this.ghlClient.makeRequest('GET', `/oauth/apps/${args.appId}?locationId=${locationId}`);
      }
      case 'get_installed_locations': {
        const params = new URLSearchParams();
        params.append('appId', String(args.appId));
        params.append('companyId', String(args.companyId));
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.query) params.append('query', String(args.query));
        if (args.isInstalled !== undefined) params.append('isInstalled', String(args.isInstalled));
        return this.ghlClient.makeRequest('GET', `/oauth/installedLocations?${params.toString()}`);
      }
      case 'get_access_token_info': {
        return this.ghlClient.makeRequest('GET', `/oauth/locationToken`);
      }
      case 'get_location_access_token': {
        return this.ghlClient.makeRequest('POST', `/oauth/locationToken`, {
          companyId: args.companyId,
          locationId: args.locationId
        });
      }
      case 'get_connected_integrations': {
        return this.ghlClient.makeRequest('GET', `/integrations/connected?locationId=${locationId}`);
      }
      case 'disconnect_integration': {
        return this.ghlClient.makeRequest('DELETE', `/integrations/${args.integrationId}?locationId=${locationId}`);
      }
      case 'get_api_keys': {
        return this.ghlClient.makeRequest('GET', `/oauth/api-keys?locationId=${locationId}`);
      }
      case 'create_api_key': {
        return this.ghlClient.makeRequest('POST', `/oauth/api-keys`, {
          locationId,
          name: args.name,
          scopes: args.scopes
        });
      }
      case 'delete_api_key': {
        return this.ghlClient.makeRequest('DELETE', `/oauth/api-keys/${args.keyId}?locationId=${locationId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
