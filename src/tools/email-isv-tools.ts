/**
 * GoHighLevel Email ISV Tools
 * Implements email verification + sending domain management + deliverability
 * functionality for the MCP server.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPVerifyEmailParams,
  GHLEmailVerificationResponse
} from '../types/ghl-types.js';

/**
 * Email ISV Tools class
 * Provides email verification and sending domain management capabilities
 */
export class EmailISVTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all Email ISV operations
   */
  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'verify_email',
        description: 'Verify email address deliverability and get risk assessment. Charges will be deducted from the specified location wallet.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID - charges will be deducted from this location wallet'
            },
            type: {
              type: 'string',
              enum: ['email', 'contact'],
              description: 'Verification type: "email" for direct email verification, "contact" for contact ID verification'
            },
            verify: {
              type: 'string',
              description: 'Email address to verify (if type=email) or contact ID (if type=contact)'
            },
          },
          required: ['locationId', 'type', 'verify']
        },
        _meta: {
          labels: {
            category: "email",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // ─── Sending Domain Management ─────────────────────────────────────────
      {
        name: 'ghl_list_email_domains',
        description: 'List all connected email sending domains for a location. Shows verification status, DKIM/SPF/DMARC configuration, and default domain.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID to list domains for (uses default if not provided)'
            }
          }
        },
        _meta: {
          labels: { category: 'email-isv', access: 'read', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_add_email_domain',
        description: 'Add a new sending domain to a location. After adding, DNS records must be configured and the domain verified.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID to add the domain to (uses default if not provided)'
            },
            domain: {
              type: 'string',
              description: 'The domain name to add (e.g., "mail.example.com")'
            }
          },
          required: ['domain']
        },
        _meta: {
          labels: { category: 'email-isv', access: 'write', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_verify_email_domain',
        description: 'Trigger DNS verification check for an email sending domain. Returns whether DKIM, SPF, and DMARC records are correctly configured.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            domainId: {
              type: 'string',
              description: 'The ID of the domain to verify'
            }
          },
          required: ['domainId']
        },
        _meta: {
          labels: { category: 'email-isv', access: 'write', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_delete_email_domain',
        description: 'Remove a sending domain from a location. Emails using this domain will no longer be sent after removal.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            domainId: {
              type: 'string',
              description: 'The ID of the domain to remove'
            }
          },
          required: ['domainId']
        },
        _meta: {
          labels: { category: 'email-isv', access: 'delete', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_get_domain_dns_records',
        description: 'Get the required DNS records (DKIM, SPF, DMARC) for a sending domain. Returns records you need to add to your DNS provider.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            domainId: {
              type: 'string',
              description: 'The ID of the domain to get DNS records for'
            }
          },
          required: ['domainId']
        },
        _meta: {
          labels: { category: 'email-isv', access: 'read', complexity: 'simple' }
        }
      },

      // ─── Deliverability & Stats ──────────────────────────────────────────
      {
        name: 'ghl_get_email_stats',
        description: 'Get email deliverability statistics for a location including sent, delivered, bounced, spam complaints, and open/click rates.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID to get stats for (uses default if not provided)'
            },
            domainId: {
              type: 'string',
              description: 'Filter stats by specific sending domain'
            },
            startDate: {
              type: 'string',
              description: 'Start date for stats period (YYYY-MM-DD format)'
            },
            endDate: {
              type: 'string',
              description: 'End date for stats period (YYYY-MM-DD format)'
            }
          }
        },
        _meta: {
          labels: { category: 'email-isv', access: 'read', complexity: 'simple' }
        }
      },

      // ─── Provider Management ─────────────────────────────────────────────
      {
        name: 'ghl_list_email_providers',
        description: 'List all ISV (integrated service vendor) email providers connected to a location (e.g., Mailgun, SendGrid, Postmark).',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID to list providers for (uses default if not provided)'
            }
          }
        },
        _meta: {
          labels: { category: 'email-isv', access: 'read', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_set_default_email_provider',
        description: 'Set the default email provider for a location. All outbound emails will use this provider unless overridden.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            providerId: {
              type: 'string',
              description: 'The ID of the email provider to set as default'
            }
          },
          required: ['providerId']
        },
        _meta: {
          labels: { category: 'email-isv', access: 'write', complexity: 'simple' }
        }
      }
    ];
  }

  /**
   * Execute email ISV tools
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'verify_email':
        return await this.verifyEmail(args as MCPVerifyEmailParams);

      // ─── Domain Management ──────────────────────────────────────────────
      case 'ghl_list_email_domains': {
        const locationId = args.locationId || this.ghlClient.getConfig().locationId;
        const params = new URLSearchParams();
        if (locationId) params.append('locationId', locationId);
        const qs = params.toString();
        return this.ghlClient.makeRequest('GET', `/email-isv/domains${qs ? `?${qs}` : ''}`);
      }

      case 'ghl_add_email_domain': {
        const locationId = args.locationId || this.ghlClient.getConfig().locationId;
        const body: Record<string, unknown> = { domain: args.domain };
        if (locationId) body.locationId = locationId;
        return this.ghlClient.makeRequest('POST', '/email-isv/domains', body);
      }

      case 'ghl_verify_email_domain': {
        return this.ghlClient.makeRequest('POST', `/email-isv/domains/${args.domainId}/verify`);
      }

      case 'ghl_delete_email_domain': {
        return this.ghlClient.makeRequest('DELETE', `/email-isv/domains/${args.domainId}`);
      }

      case 'ghl_get_domain_dns_records': {
        return this.ghlClient.makeRequest('GET', `/email-isv/domains/${args.domainId}/dns-records`);
      }

      // ─── Stats ──────────────────────────────────────────────────────────
      case 'ghl_get_email_stats': {
        const locationId = args.locationId || this.ghlClient.getConfig().locationId;
        const params = new URLSearchParams();
        if (locationId) params.append('locationId', locationId);
        if (args.domainId) params.append('domainId', String(args.domainId));
        if (args.startDate) params.append('startDate', String(args.startDate));
        if (args.endDate) params.append('endDate', String(args.endDate));
        const qs = params.toString();
        return this.ghlClient.makeRequest('GET', `/email-isv/stats${qs ? `?${qs}` : ''}`);
      }

      // ─── Providers ──────────────────────────────────────────────────────
      case 'ghl_list_email_providers': {
        const locationId = args.locationId || this.ghlClient.getConfig().locationId;
        const params = new URLSearchParams();
        if (locationId) params.append('locationId', locationId);
        const qs = params.toString();
        return this.ghlClient.makeRequest('GET', `/email-isv/providers${qs ? `?${qs}` : ''}`);
      }

      case 'ghl_set_default_email_provider': {
        const locationId = args.locationId || this.ghlClient.getConfig().locationId;
        const body: Record<string, unknown> = { providerId: args.providerId };
        if (locationId) body.locationId = locationId;
        return this.ghlClient.makeRequest('PATCH', '/email-isv/providers/default', body);
      }

      default:
        throw new Error(`Unknown email ISV tool: ${name}`);
    }
  }

  /**
   * Verify email address or contact
   */
  private async verifyEmail(params: MCPVerifyEmailParams): Promise<{
    success: boolean;
    verification: GHLEmailVerificationResponse;
    message: string;
  }> {
    try {
      const result = await this.ghlClient.verifyEmail(params.locationId, {
        type: params.type,
        verify: params.verify
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          verification: { verified: false, message: 'Verification failed', address: params.verify } as any,
          message: result.error?.message || 'Email verification failed'
        };
      }

      const verification = result.data;
      
      // Determine if this is a successful verification response
      const isVerified = 'result' in verification;
      let message: string;

      if (isVerified) {
        const verifiedResult = verification as any;
        message = `Email verification completed. Result: ${verifiedResult.result}, Risk: ${verifiedResult.risk}`;
        
        if (verifiedResult.reason && verifiedResult.reason.length > 0) {
          message += `, Reasons: ${verifiedResult.reason.join(', ')}`;
        }
        
        if (verifiedResult.leadconnectorRecomendation?.isEmailValid !== undefined) {
          message += `, Recommended: ${verifiedResult.leadconnectorRecomendation.isEmailValid ? 'Valid' : 'Invalid'}`;
        }
      } else {
        const notVerifiedResult = verification as any;
        message = `Email verification not processed: ${notVerifiedResult.message}`;
      }

      return {
        success: true,
        verification,
        message
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        verification: { verified: false, message: errorMessage, address: params.verify } as any,
        message: `Failed to verify email: ${errorMessage}`
      };
    }
  }
} 