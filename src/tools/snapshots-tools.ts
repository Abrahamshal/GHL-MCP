/**
 * GoHighLevel Snapshots Tools
 * Tools for managing snapshots (location templates/backups)
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class SnapshotsTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'get_snapshots',
        description: 'Get all snapshots for a company/agency. Snapshots are templates that can be used to set up new locations.',
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
              description: 'Maximum number of snapshots to return'
            },
          },
          required: ['companyId']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_snapshot',
        description: 'Get a specific snapshot by ID',
        inputSchema: {
          type: 'object',
          properties: {
            snapshotId: {
              type: 'string',
              description: 'The snapshot ID to retrieve'
            },
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
          },
          required: ['snapshotId', 'companyId']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_snapshot',
        description: 'Create a new snapshot from a location (backs up location settings)',
        inputSchema: {
          type: 'object',
          properties: {
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Source location ID to create snapshot from'
            },
            name: {
              type: 'string',
              description: 'Name for the snapshot'
            },
            description: {
              type: 'string',
              description: 'Description of the snapshot'
            },
          },
          required: ['companyId', 'locationId', 'name']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "write",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_snapshot_push_status',
        description: 'Check the status of a snapshot push operation',
        inputSchema: {
          type: 'object',
          properties: {
            snapshotId: {
              type: 'string',
              description: 'The snapshot ID'
            },
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            pushId: {
              type: 'string',
              description: 'The push operation ID'
            },
          },
          required: ['snapshotId', 'companyId']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'get_latest_snapshot_push',
        description: 'Get the latest snapshot push for a location',
        inputSchema: {
          type: 'object',
          properties: {
            snapshotId: {
              type: 'string',
              description: 'The snapshot ID'
            },
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationId: {
              type: 'string',
              description: 'Target location ID'
            },
          },
          required: ['snapshotId', 'companyId', 'locationId']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'push_snapshot_to_subaccounts',
        description: 'Push/deploy a snapshot to one or more sub-accounts',
        inputSchema: {
          type: 'object',
          properties: {
            snapshotId: {
              type: 'string',
              description: 'The snapshot ID to push'
            },
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            locationIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of location IDs to push the snapshot to'
            },
            override: {
              type: 'object',
              properties: {
                workflows: { type: 'boolean', description: 'Override existing workflows' },
                campaigns: { type: 'boolean', description: 'Override existing campaigns' },
                funnels: { type: 'boolean', description: 'Override existing funnels' },
                websites: { type: 'boolean', description: 'Override existing websites' },
                forms: { type: 'boolean', description: 'Override existing forms' },
                surveys: { type: 'boolean', description: 'Override existing surveys' },
                calendars: { type: 'boolean', description: 'Override existing calendars' },
                automations: { type: 'boolean', description: 'Override existing automations' },
                triggers: { type: 'boolean', description: 'Override existing triggers' },
              },
              description: 'What to override vs skip'
            }
          },
          required: ['snapshotId', 'companyId', 'locationIds']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'create_snapshot_share_link',
        description: 'Generate a shareable link for a snapshot so it can be distributed or imported by other agencies',
        inputSchema: {
          type: 'object',
          properties: {
            snapshotId: {
              type: 'string',
              description: 'The snapshot ID to create a share link for'
            },
            companyId: {
              type: 'string',
              description: 'Company/Agency ID'
            },
            shareType: {
              type: 'string',
              enum: ['link', 'permanent_link'],
              description: 'Type of share link to generate (link = temporary, permanent_link = never expires)'
            },
            expiryTime: {
              type: 'string',
              description: 'Expiry date/time for the share link (ISO 8601 format, for non-permanent links)'
            }
          },
          required: ['snapshotId', 'companyId']
        },
        _meta: {
          labels: {
            category: "snapshots",
            access: "write",
            complexity: "simple"
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const companyId = args.companyId as string;

    switch (toolName) {
      case 'get_snapshots': {
        const params = new URLSearchParams();
        params.append('companyId', companyId);
        if (args.skip) params.append('skip', String(args.skip));
        if (args.limit) params.append('limit', String(args.limit));
        
        return this.ghlClient.makeRequest('GET', `/snapshots/?${params.toString()}`);
      }

      case 'get_snapshot': {
        const snapshotId = args.snapshotId as string;
        return this.ghlClient.makeRequest('GET', `/snapshots/${snapshotId}?companyId=${companyId}`);
      }

      case 'create_snapshot': {
        const body: Record<string, unknown> = {
          companyId,
          locationId: args.locationId,
          name: args.name
        };
        if (args.description) body.description = args.description;
        
        return this.ghlClient.makeRequest('POST', `/snapshots/`, body);
      }

      case 'get_snapshot_push_status': {
        const snapshotId = args.snapshotId as string;
        const params = new URLSearchParams();
        params.append('companyId', companyId);
        if (args.pushId) params.append('pushId', String(args.pushId));
        
        return this.ghlClient.makeRequest('GET', `/snapshots/${snapshotId}/push?${params.toString()}`);
      }

      case 'get_latest_snapshot_push': {
        const snapshotId = args.snapshotId as string;
        const locationId = args.locationId as string;
        return this.ghlClient.makeRequest('GET', `/snapshots/${snapshotId}/push/${locationId}?companyId=${companyId}`);
      }

      case 'push_snapshot_to_subaccounts': {
        const snapshotId = args.snapshotId as string;
        const body: Record<string, unknown> = {
          companyId,
          locationIds: args.locationIds
        };
        if (args.override) body.override = args.override;
        
        return this.ghlClient.makeRequest('POST', `/snapshots/${snapshotId}/push`, body);
      }

      case 'create_snapshot_share_link': {
        const snapshotId = args.snapshotId as string;
        const body: Record<string, unknown> = {
          companyId,
          snapshotId
        };
        if (args.shareType) body.shareType = args.shareType;
        if (args.expiryTime) body.expiryTime = args.expiryTime;

        return this.ghlClient.makeRequest('POST', `/snapshots/share/link`, body);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
