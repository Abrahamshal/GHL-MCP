/**
 * GoHighLevel Custom Menus Tools
 * Tools for managing custom menu links (agency sidebar navigation items)
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class CustomMenusTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'list_custom_menus',
        description: 'Get a list of custom menu links. Returns custom menu configurations including menu items, categories, and associated metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Unique identifier of the location (uses default if not provided)'
            },
            skip: {
              type: 'number',
              description: 'Number of items to skip for pagination (default: 0)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of items to return (default: 20)'
            },
            query: {
              type: 'string',
              description: 'Search query to filter custom menus by name (supports partial or full names)'
            },
            showOnCompany: {
              type: 'boolean',
              description: 'Filter to show only agency-level menu links. When omitted, fetches both agency and sub-account menu links. Ignored if locationId is provided.'
            }
          }
        },
        _meta: {
          labels: {
            category: 'custom-menus',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'create_custom_menu',
        description: 'Create a new custom menu link for a company. For icon usage details refer to GHL documentation.',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Title of the custom menu'
            },
            url: {
              type: 'string',
              description: 'URL of the custom menu'
            },
            order: {
              type: 'number',
              description: 'Display order of the custom menu'
            },
            showOnCompany: {
              type: 'boolean',
              description: 'Whether the menu should be shown at the agency level'
            },
            showOnLocation: {
              type: 'boolean',
              description: 'Whether the menu should be displayed for sub-accounts level'
            },
            showToAllLocations: {
              type: 'boolean',
              description: 'Whether the menu should be displayed to all sub-accounts'
            },
            locations: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of sub-account IDs where the menu should be shown (applicable only when showOnLocation is true and showToAllLocations is false)'
            },
            openMode: {
              type: 'string',
              enum: ['iframe', 'new_tab', 'current_tab'],
              description: 'Mode for opening the menu link'
            },
            userRole: {
              type: 'string',
              enum: ['all', 'admin', 'user'],
              description: 'Which user roles should the menu be accessible to'
            },
            allowCamera: {
              type: 'boolean',
              description: 'Whether camera access is allowed for this menu'
            },
            allowMicrophone: {
              type: 'boolean',
              description: 'Whether microphone access is allowed for this menu'
            },
            icon: {
              type: 'object',
              description: 'Icon information for the menu item',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the icon (e.g., "yin-yang")'
                },
                fontFamily: {
                  type: 'string',
                  enum: ['fab', 'fas', 'far'],
                  description: 'Font family of the icon'
                }
              }
            }
          },
          required: ['title', 'url']
        },
        _meta: {
          labels: {
            category: 'custom-menus',
            access: 'write',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'get_custom_menu',
        description: 'Get a single custom menu link by ID. Returns the custom menu configuration including structure, items, and relevant metadata.',
        inputSchema: {
          type: 'object',
          properties: {
            customMenuId: {
              type: 'string',
              description: 'Unique identifier of the custom menu'
            }
          },
          required: ['customMenuId']
        },
        _meta: {
          labels: {
            category: 'custom-menus',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'update_custom_menu',
        description: 'Update an existing custom menu link for a given company.',
        inputSchema: {
          type: 'object',
          properties: {
            customMenuId: {
              type: 'string',
              description: 'ID of the custom menu to update'
            },
            title: {
              type: 'string',
              description: 'Title of the custom menu'
            },
            url: {
              type: 'string',
              description: 'URL of the custom menu'
            },
            order: {
              type: 'number',
              description: 'Display order of the custom menu'
            },
            showOnCompany: {
              type: 'boolean',
              description: 'Whether the menu should be shown at the agency level'
            },
            showOnLocation: {
              type: 'boolean',
              description: 'Whether the menu should be displayed for sub-accounts level'
            },
            showToAllLocations: {
              type: 'boolean',
              description: 'Whether the menu should be displayed to all sub-accounts'
            },
            locations: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of sub-account IDs where the menu should be shown'
            },
            openMode: {
              type: 'string',
              enum: ['iframe', 'new_tab', 'current_tab'],
              description: 'Mode for opening the menu link'
            },
            userRole: {
              type: 'string',
              enum: ['all', 'admin', 'user'],
              description: 'Which user roles should the menu be accessible to'
            },
            allowCamera: {
              type: 'boolean',
              description: 'Whether camera access is allowed for this menu'
            },
            allowMicrophone: {
              type: 'boolean',
              description: 'Whether microphone access is allowed for this menu'
            },
            icon: {
              type: 'object',
              description: 'Icon information for the menu item',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the icon'
                },
                fontFamily: {
                  type: 'string',
                  enum: ['fab', 'fas', 'far'],
                  description: 'Font family of the icon'
                }
              }
            }
          },
          required: ['customMenuId']
        },
        _meta: {
          labels: {
            category: 'custom-menus',
            access: 'write',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'delete_custom_menu',
        description: 'Delete a specific custom menu link from the system. The custom menu is identified by its unique ID.',
        inputSchema: {
          type: 'object',
          properties: {
            customMenuId: {
              type: 'string',
              description: 'ID of the custom menu to delete'
            }
          },
          required: ['customMenuId']
        },
        _meta: {
          labels: {
            category: 'custom-menus',
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
      case 'list_custom_menus': {
        const params = new URLSearchParams();
        if (locationId) params.append('locationId', locationId);
        if (args.skip !== undefined) params.append('skip', String(args.skip));
        if (args.limit !== undefined) params.append('limit', String(args.limit));
        if (args.query) params.append('query', args.query as string);
        if (args.showOnCompany !== undefined) params.append('showOnCompany', String(args.showOnCompany));
        const qs = params.toString();
        return this.ghlClient.makeRequest('GET', `/custom-menus/${qs ? `?${qs}` : ''}`);
      }

      case 'create_custom_menu': {
        const body: Record<string, unknown> = {};
        if (args.title) body.title = args.title;
        if (args.url) body.url = args.url;
        if (args.order !== undefined) body.order = args.order;
        if (args.showOnCompany !== undefined) body.showOnCompany = args.showOnCompany;
        if (args.showOnLocation !== undefined) body.showOnLocation = args.showOnLocation;
        if (args.showToAllLocations !== undefined) body.showToAllLocations = args.showToAllLocations;
        if (args.locations) body.locations = args.locations;
        if (args.openMode) body.openMode = args.openMode;
        if (args.userRole) body.userRole = args.userRole;
        if (args.allowCamera !== undefined) body.allowCamera = args.allowCamera;
        if (args.allowMicrophone !== undefined) body.allowMicrophone = args.allowMicrophone;
        if (args.icon) body.icon = args.icon;
        return this.ghlClient.makeRequest('POST', '/custom-menus/', body);
      }

      case 'get_custom_menu': {
        const customMenuId = args.customMenuId as string;
        return this.ghlClient.makeRequest('GET', `/custom-menus/${customMenuId}`);
      }

      case 'update_custom_menu': {
        const customMenuId = args.customMenuId as string;
        const body: Record<string, unknown> = {};
        if (args.title) body.title = args.title;
        if (args.url) body.url = args.url;
        if (args.order !== undefined) body.order = args.order;
        if (args.showOnCompany !== undefined) body.showOnCompany = args.showOnCompany;
        if (args.showOnLocation !== undefined) body.showOnLocation = args.showOnLocation;
        if (args.showToAllLocations !== undefined) body.showToAllLocations = args.showToAllLocations;
        if (args.locations) body.locations = args.locations;
        if (args.openMode) body.openMode = args.openMode;
        if (args.userRole) body.userRole = args.userRole;
        if (args.allowCamera !== undefined) body.allowCamera = args.allowCamera;
        if (args.allowMicrophone !== undefined) body.allowMicrophone = args.allowMicrophone;
        if (args.icon) body.icon = args.icon;
        return this.ghlClient.makeRequest('PUT', `/custom-menus/${customMenuId}`, body);
      }

      case 'delete_custom_menu': {
        const customMenuId = args.customMenuId as string;
        return this.ghlClient.makeRequest('DELETE', `/custom-menus/${customMenuId}`);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
