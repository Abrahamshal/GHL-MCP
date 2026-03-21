/**
 * GoHighLevel Proposals & Documents Tools
 * Tools for managing proposals, documents, and contract templates
 */

import { GHLApiClient } from '../clients/ghl-api-client.js';

export class ProposalsTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions() {
    return [
      {
        name: 'list_proposals_documents',
        description: 'List proposal/contract documents for a location. Supports filtering by status, payment status, and date range.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            status: {
              type: 'string',
              description: 'Document status filter (comma-separated): draft, sent, viewed, completed, accepted'
            },
            paymentStatus: {
              type: 'string',
              description: 'Payment status filter (comma-separated): waiting_for_payment, paid, no_payment'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip for pagination'
            },
            query: {
              type: 'string',
              description: 'Search string to filter documents by name'
            },
            dateFrom: {
              type: 'string',
              description: 'Start date filter (ISO 8601 format). Must be provided with dateTo.'
            },
            dateTo: {
              type: 'string',
              description: 'End date filter (ISO 8601 format). Must be provided with dateFrom.'
            }
          }
        },
        _meta: {
          labels: {
            category: 'proposals',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'send_proposal_document',
        description: 'Send a proposal/contract document to a client via email or link.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            documentId: {
              type: 'string',
              description: 'Document ID to send'
            },
            documentName: {
              type: 'string',
              description: 'Display name of the document'
            },
            medium: {
              type: 'string',
              description: 'Delivery medium: link or email'
            },
            sentBy: {
              type: 'string',
              description: 'User ID of the sender (required)'
            },
            ccRecipients: {
              type: 'array',
              description: 'CC recipients for the document',
              items: {
                type: 'object'
              }
            },
            notificationSettings: {
              type: 'object',
              description: 'Notification settings including sender info and email template'
            }
          },
          required: ['documentId', 'sentBy']
        },
        _meta: {
          labels: {
            category: 'proposals',
            access: 'write',
            complexity: 'moderate'
          }
        }
      },
      {
        name: 'list_proposal_templates',
        description: 'List proposal/contract templates for a location. Supports filtering by type, name, and date range.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            dateFrom: {
              type: 'string',
              description: 'Start date filter (ISO 8601 format)'
            },
            dateTo: {
              type: 'string',
              description: 'End date filter (ISO 8601 format)'
            },
            type: {
              type: 'string',
              description: 'Comma-separated template types: proposal, estimate, contentLibrary'
            },
            name: {
              type: 'string',
              description: 'Filter templates by name'
            },
            isPublicDocument: {
              type: 'boolean',
              description: 'Filter for public DocForm templates'
            },
            userId: {
              type: 'string',
              description: 'User ID (required when isPublicDocument is true)'
            },
            limit: {
              type: 'string',
              description: 'Maximum number of records to return'
            },
            skip: {
              type: 'string',
              description: 'Number of records to skip for pagination'
            }
          }
        },
        _meta: {
          labels: {
            category: 'proposals',
            access: 'read',
            complexity: 'simple'
          }
        }
      },
      {
        name: 'send_proposal_template',
        description: 'Send a proposal/contract template to a contact, creating a document from the template.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID (uses default if not provided)'
            },
            templateId: {
              type: 'string',
              description: 'Template ID to send (required)'
            },
            userId: {
              type: 'string',
              description: 'User ID of the sender (required)'
            },
            contactId: {
              type: 'string',
              description: 'Contact ID to send the template to (required)'
            },
            opportunityId: {
              type: 'string',
              description: 'Opportunity ID to associate with the document'
            },
            sendDocument: {
              type: 'boolean',
              description: 'Whether to immediately send the document after creation'
            }
          },
          required: ['templateId', 'userId', 'contactId']
        },
        _meta: {
          labels: {
            category: 'proposals',
            access: 'write',
            complexity: 'moderate'
          }
        }
      }
    ];
  }

  async handleToolCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const config = this.ghlClient.getConfig();
    const locationId = (args.locationId as string) || config.locationId;

    switch (toolName) {
      case 'list_proposals_documents': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.status) params.append('status', String(args.status));
        if (args.paymentStatus) params.append('paymentStatus', String(args.paymentStatus));
        if (args.limit !== undefined) params.append('limit', String(args.limit));
        if (args.skip !== undefined) params.append('skip', String(args.skip));
        if (args.query) params.append('query', String(args.query));
        if (args.dateFrom) params.append('dateFrom', String(args.dateFrom));
        if (args.dateTo) params.append('dateTo', String(args.dateTo));
        return this.ghlClient.makeRequest('GET', `/proposals/document?${params.toString()}`);
      }

      case 'send_proposal_document': {
        const body: Record<string, unknown> = {
          locationId,
          documentId: args.documentId,
          sentBy: args.sentBy
        };
        if (args.documentName) body.documentName = args.documentName;
        if (args.medium) body.medium = args.medium;
        if (args.ccRecipients) body.ccRecipients = args.ccRecipients;
        if (args.notificationSettings) body.notificationSettings = args.notificationSettings;
        return this.ghlClient.makeRequest('POST', `/proposals/document/send`, body);
      }

      case 'list_proposal_templates': {
        const params = new URLSearchParams();
        params.append('locationId', locationId);
        if (args.dateFrom) params.append('dateFrom', String(args.dateFrom));
        if (args.dateTo) params.append('dateTo', String(args.dateTo));
        if (args.type) params.append('type', String(args.type));
        if (args.name) params.append('name', String(args.name));
        if (args.isPublicDocument !== undefined) params.append('isPublicDocument', String(args.isPublicDocument));
        if (args.userId) params.append('userId', String(args.userId));
        if (args.limit) params.append('limit', String(args.limit));
        if (args.skip) params.append('skip', String(args.skip));
        return this.ghlClient.makeRequest('GET', `/proposals/templates?${params.toString()}`);
      }

      case 'send_proposal_template': {
        const body: Record<string, unknown> = {
          locationId,
          templateId: args.templateId,
          userId: args.userId,
          contactId: args.contactId
        };
        if (args.opportunityId) body.opportunityId = args.opportunityId;
        if (args.sendDocument !== undefined) body.sendDocument = args.sendDocument;
        return this.ghlClient.makeRequest('POST', `/proposals/templates/send`, body);
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
