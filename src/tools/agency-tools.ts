/**
 * Agency workspace tools: let an agency owner discover sub-accounts and choose
 * which one every other tool operates in. Registered only when agency OAuth mode
 * is enabled. The "active" sub-account is tracked per connected client (keyed by
 * the OAuth client id), so selection persists across requests on this server.
 */

import { z } from 'zod/v4';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AgencyManager } from '../agency-client.js';

export interface AgencyToolContext {
  agency: AgencyManager;
  clientKey: string;
}

const text = (t: string) => ({ content: [{ type: 'text' as const, text: t }] });
const errText = (t: string) => ({ content: [{ type: 'text' as const, text: t }], isError: true });

export function registerAgencyTools(server: McpServer, ctx: AgencyToolContext): void {
  const { agency, clientKey } = ctx;

  server.registerTool(
    'ghl_list_subaccounts',
    {
      title: 'List agency sub-accounts',
      description:
        'List the GoHighLevel sub-accounts (locations) under this agency. Use this to find the sub-account you want to work in, then call ghl_select_subaccount.',
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        search: z.string().optional().describe('Optional name filter'),
        limit: z.number().int().positive().max(500).optional().describe('Max results (default 100)'),
      },
    },
    async ({ search, limit }) => {
      try {
        const subs = await agency.listSubAccounts({ search, limit });
        if (!subs.length) return text('No sub-accounts found for this agency.');
        const active = agency.getActiveLocation(clientKey);
        const lines = subs.map((s) => `${s.id === active ? '➡️ ' : '   '}${s.name}  —  ${s.id}`);
        return text(`Sub-accounts (${subs.length}):\n${lines.join('\n')}\n\nCall ghl_select_subaccount with a locationId (or name) to start working in one.`);
      } catch (err: any) {
        return errText(`Failed to list sub-accounts: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'ghl_select_subaccount',
    {
      title: 'Select active sub-account',
      description:
        'Choose which sub-account (location) all subsequent GoHighLevel tools operate in. Provide either a locationId or a name to match. Selection persists for this connection.',
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      inputSchema: {
        locationId: z.string().optional().describe('The sub-account/location ID to switch to'),
        name: z.string().optional().describe('Sub-account name to match if you do not have the ID'),
      },
    },
    async ({ locationId, name }) => {
      try {
        let targetId = locationId?.trim();
        let targetName = name?.trim();

        if (!targetId && targetName) {
          const subs = await agency.listSubAccounts({ search: targetName });
          const lower = targetName.toLowerCase();
          const exact = subs.filter((s) => s.name.toLowerCase() === lower);
          const partial = subs.filter((s) => s.name.toLowerCase().includes(lower));
          const matches = exact.length ? exact : partial;
          if (matches.length === 0) return errText(`No sub-account matches "${targetName}".`);
          if (matches.length > 1) {
            return errText(`Multiple sub-accounts match "${targetName}":\n${matches.map((m) => `- ${m.name} (${m.id})`).join('\n')}\nRe-run with the exact locationId.`);
          }
          targetId = matches[0].id;
          targetName = matches[0].name;
        }

        if (!targetId) return errText('Provide a locationId or a name to select a sub-account.');

        // Mint a token now to confirm access before committing the selection.
        await agency.getLocationToken(targetId);
        agency.setActiveLocation(clientKey, targetId, targetName);
        const label = targetName || agency.getSubAccountName(targetId) || targetId;
        return text(`Now working in sub-account: ${label} (${targetId}). All GoHighLevel tools will target this account until you switch.`);
      } catch (err: any) {
        return errText(`Failed to select sub-account: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'ghl_subaccount_status',
    {
      title: 'Pause or enable a sub-account',
      description:
        'Pause (freeze) or re-enable a GoHighLevel sub-account via the SaaS API. DESTRUCTIVE for the client experience: pausing locks the account. Requires confirm: true, which must only be set after the user explicitly approves.',
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
      inputSchema: {
        locationId: z.string().describe('The sub-account/location ID to pause or enable'),
        action: z.enum(['pause', 'unpause']).describe('pause freezes the sub-account; unpause lifts the freeze'),
        confirm: z.boolean().describe('Must be true. Only set after the user has explicitly confirmed this action.'),
      },
    },
    async ({ locationId, action, confirm }) => {
      if (confirm !== true) {
        return errText('Not executed: this action requires confirm: true after explicit user approval.');
      }
      try {
        const companyId = agency.getCompanyId();
        if (!companyId) return errText('Agency companyId unknown — is the agency connected?');
        await agency.agencyRequest('POST', `/saas-api/public-api/pause/${encodeURIComponent(locationId)}`, {
          paused: action === 'pause',
          companyId,
        });
        const label = agency.getSubAccountName(locationId) || locationId;
        return text(`Sub-account ${label} (${locationId}) is now ${action === 'pause' ? 'PAUSED' : 'active (unpaused)'}.`);
      } catch (err: any) {
        return errText(`Failed to ${action} sub-account: ${err.message}`);
      }
    }
  );

  server.registerTool(
    'ghl_current_subaccount',
    {
      title: 'Show active sub-account',
      description: 'Show which GoHighLevel sub-account (location) is currently active for this connection.',
      annotations: { readOnlyHint: true },
      inputSchema: {},
    },
    async () => {
      const active = agency.getActiveLocation(clientKey);
      if (!active) return text('No sub-account selected yet. Call ghl_list_subaccounts then ghl_select_subaccount.');
      const label = agency.getSubAccountName(active) || active;
      return text(`Active sub-account: ${label} (${active}).`);
    }
  );
}
