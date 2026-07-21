import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';

type JsonRecord = Record<string, unknown>;

type WorkflowAction = {
  label: string;
  tool: string;
  arguments: JsonRecord;
  risk: 'read' | 'write' | 'destructive';
  requiresConfirmation: boolean;
};

type WorkspaceToolSpec = {
  name: string;
  title: string;
  description: string;
  app: string;
  access: 'read' | 'write';
  inputProperties?: JsonRecord;
  required?: string[];
  buildActions?: (args: JsonRecord, locationId: string) => WorkflowAction[];
  readPlan?: Array<{
    label: string;
    tool: string;
    method: 'GET' | 'POST';
    path: (args: JsonRecord, locationId: string) => string | undefined;
    body?: (args: JsonRecord, locationId: string) => JsonRecord;
    /** Override the GHL Version header (e.g. 'v3' for the chat-widget API). */
    version?: string;
  }>;
  /**
   * Endpoint-level staged writes (builder tools). Without executeConfirmed the
   * tool returns a preview of these actions; with executeConfirmed: true it
   * executes them in order and reports per-action results. Items whose path()
   * returns undefined are skipped, so one spec can cover create vs update.
   */
  writePlan?: Array<{
    label: string;
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: (args: JsonRecord, locationId: string) => string | undefined;
    body?: (args: JsonRecord, locationId: string) => JsonRecord;
    version?: string;
    destructive?: boolean;
  }>;
};

const CONTACT_FIELDS = {
  contactId: { type: 'string', description: 'GHL contact ID.' },
  firstName: { type: 'string' },
  lastName: { type: 'string' },
  email: { type: 'string' },
  phone: { type: 'string' },
  tags: { type: 'array', items: { type: 'string' } },
  note: { type: 'string' },
};

const WORKSPACE_SPECS: WorkspaceToolSpec[] = [
  {
    name: 'crm_list_workspaces',
    title: 'List Curated CRM Workspaces',
    description: 'List the high-level CRM workspaces and the workflow tools agents should prefer before using raw API endpoints.',
    app: 'tool-explorer',
    access: 'read',
  },
  {
    name: 'crm_contact_workspace',
    title: 'Open Contact Workspace Data',
    description: 'Gather the read-side context for a single contact workspace: profile, activity, opportunities, and tasks.',
    app: 'contact-workspace',
    access: 'read',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      query: { type: 'string', description: 'Name, email, or phone search.' },
      includeActivity: { type: 'boolean', default: true },
    },
    readPlan: [
      { label: 'Contact profile', tool: 'get_contact', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}` : undefined },
      { label: 'Contact search', tool: 'search_contacts', method: 'GET', path: (args, locationId) => stringArg(args.query) ? `/contacts/search?locationId=${enc(locationId)}&query=${enc(stringArg(args.query))}` : undefined },
      { label: 'Contact tasks', tool: 'get_contact_tasks', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}/tasks` : undefined },
      { label: 'Contact notes', tool: 'get_contact_notes', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}/notes` : undefined },
    ],
  },
  {
    name: 'crm_location_overview',
    title: 'Location Overview',
    description: 'Gather one compact, read-only operating overview for a GHL location: location profile, contacts, pipelines, calendars, products, and email activity.',
    app: 'agency-admin',
    access: 'read',
    readPlan: [
      { label: 'Location profile', tool: 'get_location', method: 'GET', path: (_args, locationId) => `/locations/${enc(locationId)}` },
      { label: 'Recent contacts', tool: 'search_contacts', method: 'POST', path: () => '/contacts/search', body: (_args, locationId) => ({ locationId, pageLimit: 5 }) },
      { label: 'Pipelines', tool: 'get_pipelines', method: 'GET', path: (_args, locationId) => `/opportunities/pipelines?locationId=${enc(locationId)}` },
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Products', tool: 'list_products', method: 'GET', path: (_args, locationId) => `/products/?locationId=${enc(locationId)}&limit=5` },
      { label: 'Email campaigns', tool: 'official_emails_list_campaign_emails_v2', method: 'GET', path: (_args, locationId) => `/emails/public/v2/locations/${enc(locationId)}/campaigns/emails?limit=5` },
    ],
  },
  {
    name: 'crm_daily_briefing',
    title: 'Daily Briefing',
    description: 'Build a read-only daily operating briefing from recent contacts, opportunities, calendars, reviews, and email activity.',
    app: 'agency-admin',
    access: 'read',
    inputProperties: { focus: { type: 'string' }, limit: { type: 'number' } },
    readPlan: [
      { label: 'Recent contacts', tool: 'search_contacts', method: 'POST', path: () => '/contacts/search', body: (args, locationId) => ({ locationId, pageLimit: numberArg(args.limit) || 5 }) },
      { label: 'Open opportunities', tool: 'search_opportunities', method: 'GET', path: (_args, locationId) => `/opportunities/search?location_id=${enc(locationId)}&status=open` },
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Reviews', tool: 'get_reviews', method: 'GET', path: (_args, locationId) => `/reputation/reviews?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_search_everything',
    title: 'Search Everything',
    description: 'Search across contacts, conversations, opportunities, calendars, and products from one agent-friendly tool.',
    app: 'tool-explorer',
    access: 'read',
    inputProperties: { query: { type: 'string' }, limit: { type: 'number' } },
    readPlan: [
      { label: 'Contacts', tool: 'search_contacts', method: 'POST', path: () => '/contacts/search', body: (args, locationId) => ({ locationId, pageLimit: numberArg(args.limit) || 5, query: args.query }) },
      { label: 'Conversations', tool: 'search_conversations', method: 'GET', path: (args, locationId) => `/conversations/search?locationId=${enc(locationId)}${stringArg(args.query) ? `&query=${enc(stringArg(args.query))}` : ''}` },
      { label: 'Opportunities', tool: 'search_opportunities', method: 'GET', path: (_args, locationId) => `/opportunities/search?location_id=${enc(locationId)}` },
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Products', tool: 'list_products', method: 'GET', path: (_args, locationId) => `/products/?locationId=${enc(locationId)}&limit=5` },
    ],
  },
  {
    name: 'crm_get_next_page',
    title: 'Get Next Page Helper',
    description: 'Prepare the next read call for paginated tools without requiring the agent to remember cursor or searchAfter details.',
    app: 'tool-explorer',
    access: 'read',
    inputProperties: { tool: { type: 'string' }, searchAfter: { type: 'array' }, page: { type: 'number' }, limit: { type: 'number' }, query: { type: 'string' } },
    buildActions: (args, locationId) => [
      action('Next contacts page', 'search_contacts', { locationId, pageLimit: numberArg(args.limit) || 25, searchAfter: args.searchAfter, query: args.query }, 'read', false),
      action('Next generic page', stringArg(args.tool) || 'search_contacts', { locationId, page: args.page, limit: args.limit, query: args.query }, 'read', false),
    ],
  },
  {
    name: 'crm_next_best_actions',
    title: 'Next Best Actions',
    description: 'Prepare a prioritized set of safe next actions from CRM context: follow-up task, note, message draft, and optional workflow enrollment.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, opportunityId: { type: 'string' }, reason: { type: 'string' }, message: { type: 'string' }, workflowId: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load contact context', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Add recommended note', 'create_contact_note', { contactId: args.contactId, body: args.reason || 'Next-best-action recommendation reviewed.' }, 'write', true),
      action('Create recommended task', 'create_contact_task', { contactId: args.contactId, title: args.reason || 'Follow up on recommended next action' }, 'write', true),
      action('Draft recommended message', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
      action('Enroll recommended workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_contact_update',
    title: 'Prepare Contact Update',
    description: 'Prepare a confirmation-gated contact update with duplicate checks, notes, tags, and follow-up task options.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: {
      ...CONTACT_FIELDS,
      taskTitle: { type: 'string' },
      dueDate: { type: 'string' },
    },
    buildActions: (args, locationId) => [
      action('Duplicate guard', 'get_duplicate_contact', { locationId, email: args.email, phone: args.phone }, 'read', false),
      action('Save contact fields', stringArg(args.contactId) ? 'update_contact' : 'upsert_contact', pick(args, ['contactId', 'firstName', 'lastName', 'email', 'phone', 'tags']), 'write', true),
      action('Add contact note', 'create_contact_note', { contactId: args.contactId, body: args.note }, 'write', true),
      action('Create follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle, dueDate: args.dueDate }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_contact_followup',
    title: 'Prepare Contact Follow-Up',
    description: 'Prepare a contact follow-up bundle: context read, note, task, and optional SMS/email draft.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, channel: { type: 'string', enum: ['sms', 'email'] }, subject: { type: 'string' }, taskTitle: { type: 'string' }, dueDate: { type: 'string' }, note: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load contact context', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Add follow-up note', 'create_contact_note', { contactId: args.contactId, body: args.note || args.message }, 'write', true),
      action('Create follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Follow up', dueDate: args.dueDate }, 'write', true),
      action('Draft follow-up message', stringArg(args.channel) === 'email' ? 'send_email' : 'send_sms', pick(args, ['contactId', 'subject', 'message']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_contact_note',
    title: 'Prepare Contact Note',
    description: 'Prepare an internal contact note, staged for confirmation before writing to GHL.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, body: { type: 'string' } },
    required: ['contactId', 'body'],
    buildActions: (args) => [action('Add contact note', 'create_contact_note', { contactId: args.contactId, body: args.body }, 'write', true)],
  },
  {
    name: 'crm_prepare_contact_task',
    title: 'Prepare Contact Task',
    description: 'Prepare a follow-up task for a contact with owner, due date, and notes.',
    app: 'contact-workspace',
    access: 'write',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      title: { type: 'string' },
      dueDate: { type: 'string' },
      assignedTo: { type: 'string' },
      body: { type: 'string' },
    },
    required: ['contactId', 'title'],
    buildActions: (args) => [action('Create contact task', 'create_contact_task', pick(args, ['contactId', 'title', 'dueDate', 'assignedTo', 'body']), 'write', true)],
  },
  {
    name: 'crm_prepare_lead_intake',
    title: 'Prepare Lead Intake',
    description: 'Normalize a new lead, check for duplicates, prepare contact upsert, opportunity creation, assignment, and workflow enrollment.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: {
      source: { type: 'string' },
      name: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      intent: { type: 'string' },
      ownerId: { type: 'string' },
      pipelineId: { type: 'string' },
      stageId: { type: 'string' },
      workflowId: { type: 'string' },
    },
    buildActions: (args, locationId) => [
      action('Duplicate guard', 'get_duplicate_contact', { locationId, email: args.email, phone: args.phone }, 'read', false),
      action('Upsert lead contact', 'upsert_contact', contactPayload(args, locationId), 'write', true),
      action('Create lead opportunity', 'create_opportunity', pick(args, ['contactId', 'pipelineId', 'stageId', 'ownerId', 'intent', 'source']), 'write', true),
      action('Enroll lead workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
    ],
  },
  {
    name: 'crm_find_unworked_leads',
    title: 'Find Unworked Leads',
    description: 'Find recent form leads and contact records that still need first-touch follow-up.',
    app: 'lead-intake',
    access: 'read',
    readPlan: [
      { label: 'Recent form submissions', tool: 'get_form_submissions', method: 'GET', path: (_args, locationId) => `/forms/submissions?locationId=${enc(locationId)}` },
      { label: 'Contact search', tool: 'search_contacts', method: 'GET', path: (_args, locationId) => `/contacts/search?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_lead_assignment',
    title: 'Prepare Lead Assignment',
    description: 'Prepare a lead owner assignment and optional first-touch task.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      ownerId: { type: 'string' },
      taskTitle: { type: 'string' },
      dueDate: { type: 'string' },
    },
    required: ['contactId', 'ownerId'],
    buildActions: (args) => [
      action('Update lead owner', 'update_contact', { contactId: args.contactId, assignedTo: args.ownerId }, 'write', true),
      action('Create first-touch task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'First-touch follow-up', dueDate: args.dueDate, assignedTo: args.ownerId }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_lead_reactivation',
    title: 'Prepare Lead Reactivation',
    description: 'Prepare a dormant lead reactivation plan with tag, note, task, optional message, and optional workflow enrollment.',
    app: 'lead-intake',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, tag: { type: 'string' }, workflowId: { type: 'string' }, taskTitle: { type: 'string' }, note: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load lead context', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Tag reactivation lead', 'add_contact_tags', { contactId: args.contactId, tags: [args.tag || 'reactivation'] }, 'write', true),
      action('Add reactivation note', 'create_contact_note', { contactId: args.contactId, body: args.note || 'Prepared lead reactivation.' }, 'write', true),
      action('Create reactivation task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Reactivate lead' }, 'write', true),
      action('Draft reactivation SMS', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
      action('Enroll reactivation workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
    ],
  },
  {
    name: 'crm_conversation_workspace',
    title: 'Open Conversation Workspace Data',
    description: 'Gather conversation threads, recent messages, and optional contact context for reply drafting.',
    app: 'conversation-inbox',
    access: 'read',
    inputProperties: {
      conversationId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      query: { type: 'string' },
      includeWidgets: { type: 'boolean', description: 'Also list the location chat widgets (website live-chat deployments).' },
      widgetId: { type: 'string', description: 'Fetch the full configuration of one chat widget (branding, settings, prompts).' },
      widgetPatch: { type: 'object', description: 'With widgetId: stage a PATCH of this widget (settings, name, default). Executes only when executeConfirmed is true after user approval. Temporary alias for crm_prepare_chat_widget for clients with cached tool lists.' },
    },
    readPlan: [
      { label: 'Conversation', tool: 'get_conversation', method: 'GET', path: (args) => stringArg(args.conversationId) ? `/conversations/${stringArg(args.conversationId)}` : undefined },
      { label: 'Messages', tool: 'get_messages', method: 'GET', path: (args) => stringArg(args.conversationId) ? `/conversations/${stringArg(args.conversationId)}/messages?limit=50` : undefined },
      // Broad inbox sweep only when the caller has not targeted a specific
      // record (or explicitly asked to search) — targeted lookups stay lean.
      { label: 'Conversation search', tool: 'search_conversations', method: 'GET', path: (args, locationId) => (stringArg(args.query) || (!stringArg(args.conversationId) && !stringArg(args.contactId) && !stringArg(args.widgetId) && !args.includeWidgets)) ? `/conversations/search?locationId=${enc(locationId)}${stringArg(args.query) ? `&query=${enc(stringArg(args.query))}` : ''}` : undefined },
      // Chat-widget API is a v3-generation endpoint (Version: v3, not a date).
      { label: 'Chat widgets', tool: 'list_chat_widgets', method: 'GET', version: 'v3', path: (args, locationId) => args.includeWidgets ? `/chat-widget/list?locationId=${enc(locationId)}&offset=0&limit=50` : undefined },
      { label: 'Chat widget detail', tool: 'get_chat_widget', method: 'GET', version: 'v3', path: (args, locationId) => stringArg(args.widgetId) ? `/chat-widget/data/${enc(locationId)}/${stringArg(args.widgetId)}` : undefined },
      { label: 'Contact profile', tool: 'get_contact', method: 'GET', path: (args) => stringArg(args.contactId) ? `/contacts/${stringArg(args.contactId)}` : undefined },
    ],
  },
  {
    name: 'crm_prepare_conversation_reply',
    title: 'Prepare Conversation Reply',
    description: 'Prepare an SMS or email reply with thread context and confirmation before any outbound message is sent.',
    app: 'conversation-inbox',
    access: 'write',
    inputProperties: {
      contactId: CONTACT_FIELDS.contactId,
      conversationId: { type: 'string' },
      channel: { type: 'string', enum: ['sms', 'email'] },
      subject: { type: 'string' },
      message: { type: 'string' },
      scheduleAt: { type: 'string' },
    },
    required: ['contactId', 'message'],
    buildActions: (args) => [
      action('Load thread context', stringArg(args.conversationId) ? 'get_conversation' : 'get_contact', stringArg(args.conversationId) ? { conversationId: args.conversationId } : { contactId: args.contactId }, 'read', false),
      action('Send reply', stringArg(args.channel) === 'email' ? 'send_email' : 'send_sms', pick(args, ['contactId', 'conversationId', 'subject', 'message', 'scheduleAt']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_conversation_status',
    title: 'Prepare Conversation Status Update',
    description: 'Prepare a conversation status update, such as marking a thread read, unread, open, or closed.',
    app: 'conversation-inbox',
    access: 'write',
    inputProperties: { conversationId: { type: 'string' }, status: { type: 'string' } },
    required: ['conversationId', 'status'],
    buildActions: (args) => [action('Update conversation status', 'update_conversation', pick(args, ['conversationId', 'status']), 'write', true)],
  },
  {
    name: 'crm_prepare_missed_call_response',
    title: 'Prepare Missed Call Response',
    description: 'Prepare a missed-call response with contact context, SMS draft, note, and follow-up task.',
    app: 'conversation-inbox',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, taskTitle: { type: 'string' }, dueDate: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load missed-call contact', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Draft missed-call SMS', 'send_sms', { contactId: args.contactId, message: args.message || 'Sorry we missed your call. How can we help?' }, 'write', true),
      action('Log missed-call note', 'create_contact_note', { contactId: args.contactId, body: 'Prepared missed-call response.' }, 'write', true),
      action('Create missed-call follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Follow up on missed call', dueDate: args.dueDate }, 'write', true),
    ],
  },
  {
    name: 'crm_pipeline_workspace',
    title: 'Open Pipeline Workspace Data',
    description: 'Gather pipeline, opportunity, and stale-deal context for a pipeline board.',
    app: 'pipeline-board',
    access: 'read',
    inputProperties: { pipelineId: { type: 'string' }, status: { type: 'string' } },
    readPlan: [
      { label: 'Pipelines', tool: 'get_pipelines', method: 'GET', path: (_args, locationId) => `/opportunities/pipelines?locationId=${enc(locationId)}` },
      { label: 'Opportunities', tool: 'search_opportunities', method: 'GET', path: (args, locationId) => `/opportunities/search?location_id=${enc(locationId)}${stringArg(args.pipelineId) ? `&pipeline_id=${enc(stringArg(args.pipelineId))}` : ''}` },
    ],
  },
  {
    name: 'crm_prepare_opportunity_update',
    title: 'Prepare Opportunity Update',
    description: 'Prepare an opportunity create/update/status move with contact note and next task options.',
    app: 'pipeline-board',
    access: 'write',
    inputProperties: {
      opportunityId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      pipelineId: { type: 'string' },
      stageId: { type: 'string' },
      status: { type: 'string' },
      monetaryValue: { type: 'number' },
      title: { type: 'string' },
      nextStep: { type: 'string' },
    },
    buildActions: (args) => [
      action('Save opportunity', stringArg(args.opportunityId) ? 'update_opportunity' : 'create_opportunity', pick(args, ['opportunityId', 'contactId', 'pipelineId', 'stageId', 'status', 'monetaryValue', 'title']), 'write', true),
      action('Create next-step task', 'create_contact_task', { contactId: args.contactId, title: args.nextStep }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_pipeline_follow_up',
    title: 'Prepare Pipeline Follow-Up',
    description: 'Prepare the next action for a stale or active opportunity: task, note, owner, stage, and optional message.',
    app: 'pipeline-board',
    access: 'write',
    inputProperties: {
      opportunityId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      nextStep: { type: 'string' },
      note: { type: 'string' },
      stageId: { type: 'string' },
      ownerId: { type: 'string' },
      message: { type: 'string' },
    },
    buildActions: (args) => [
      action('Update opportunity', 'update_opportunity', pick(args, ['opportunityId', 'stageId', 'ownerId']), 'write', true),
      action('Add opportunity note', 'create_contact_note', { contactId: args.contactId, body: args.note || args.nextStep }, 'write', true),
      action('Create follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.nextStep }, 'write', true),
      action('Draft follow-up SMS', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_pipeline_cleanup',
    title: 'Prepare Pipeline Cleanup',
    description: 'Prepare cleanup actions for stale pipeline opportunities: context read, stage/status update, notes, and follow-up tasks.',
    app: 'pipeline-board',
    access: 'write',
    inputProperties: { opportunityId: { type: 'string' }, contactId: CONTACT_FIELDS.contactId, stageId: { type: 'string' }, status: { type: 'string' }, note: { type: 'string' }, taskTitle: { type: 'string' } },
    required: ['opportunityId'],
    buildActions: (args) => [
      action('Load opportunity', 'get_opportunity', { opportunityId: args.opportunityId }, 'read', false),
      action('Update stale opportunity', 'update_opportunity', pick(args, ['opportunityId', 'stageId', 'status']), 'write', true),
      action('Log cleanup note', 'create_contact_note', { contactId: args.contactId, body: args.note || 'Pipeline cleanup reviewed.' }, 'write', true),
      action('Create cleanup task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Pipeline cleanup follow-up' }, 'write', true),
    ],
  },
  {
    name: 'crm_appointment_workspace',
    title: 'Open Appointment Workspace Data',
    description: 'Gather calendars, availability, and appointment context before booking or rescheduling.',
    app: 'appointment-desk',
    access: 'read',
    inputProperties: { calendarId: { type: 'string' }, startDate: { type: 'string' }, endDate: { type: 'string' } },
    readPlan: [
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', path: (_args, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Free slots', tool: 'get_free_slots', method: 'GET', path: (args) => stringArg(args.calendarId) ? `/calendars/${stringArg(args.calendarId)}/free-slots?startDate=${enc(stringArg(args.startDate) || today())}` : undefined },
    ],
  },
  {
    name: 'crm_prepare_appointment_booking',
    title: 'Prepare Appointment Booking',
    description: 'Prepare appointment booking or reschedule actions after availability has been checked.',
    app: 'appointment-desk',
    access: 'write',
    inputProperties: {
      appointmentId: { type: 'string' },
      contactId: CONTACT_FIELDS.contactId,
      calendarId: { type: 'string' },
      startTime: { type: 'string' },
      endTime: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['contactId', 'calendarId', 'startTime'],
    buildActions: (args) => [
      action('Check free slots', 'get_free_slots', { calendarId: args.calendarId, startDate: args.startTime }, 'read', false),
      action('Save appointment', stringArg(args.appointmentId) ? 'update_appointment' : 'create_appointment', pick(args, ['appointmentId', 'contactId', 'calendarId', 'startTime', 'endTime', 'notes']), 'write', true),
      action('Add appointment note', 'create_appointment_note', { appointmentId: args.appointmentId, body: args.notes }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_appointment_reschedule',
    title: 'Prepare Appointment Reschedule',
    description: 'Prepare a reschedule action with availability check and optional contact notification.',
    app: 'appointment-desk',
    access: 'write',
    inputProperties: { appointmentId: { type: 'string' }, calendarId: { type: 'string' }, startTime: { type: 'string' }, notifyContact: { type: 'boolean' }, message: { type: 'string' } },
    required: ['appointmentId', 'calendarId', 'startTime'],
    buildActions: (args) => [
      action('Check new slot', 'get_free_slots', { calendarId: args.calendarId, startDate: args.startTime }, 'read', false),
      action('Reschedule appointment', 'update_appointment', pick(args, ['appointmentId', 'startTime']), 'write', true),
      action('Notify contact', 'send_sms', { contactId: args.contactId, message: args.message }, 'write', true),
    ],
  },
  {
    name: 'crm_automation_workspace',
    title: 'Open Automation Workspace Data',
    description: 'Gather campaigns, workflows, scheduled messages, and enrollment context.',
    app: 'automation-launcher',
    access: 'read',
    readPlan: [
      { label: 'Campaigns', tool: 'get_campaigns', method: 'GET', path: (_args, locationId) => `/campaigns/?locationId=${enc(locationId)}` },
      { label: 'Workflows', tool: 'ghl_get_workflows', method: 'GET', path: (_args, locationId) => `/workflows/?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_automation_enrollment',
    title: 'Prepare Automation Enrollment',
    description: 'Prepare campaign or workflow enrollment with confirmation and contact context.',
    app: 'automation-launcher',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, campaignId: { type: 'string' }, workflowId: { type: 'string' }, note: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Load contact', 'get_contact', { contactId: args.contactId }, 'read', false),
      action('Add to campaign', 'add_contact_to_campaign', { contactId: args.contactId, campaignId: args.campaignId }, 'write', true),
      action('Add to workflow', 'add_contact_to_workflow', { contactId: args.contactId, workflowId: args.workflowId }, 'write', true),
      action('Log enrollment note', 'create_contact_note', { contactId: args.contactId, body: args.note }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_workflow_trigger',
    title: 'Prepare Workflow Trigger',
    description: 'Prepare a direct workflow trigger for a contact with a human-readable reason and confirmation.',
    app: 'automation-launcher',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, workflowId: { type: 'string' }, reason: { type: 'string' } },
    required: ['contactId', 'workflowId'],
    buildActions: (args) => [
      action('Trigger workflow', 'ghl_trigger_workflow', pick(args, ['contactId', 'workflowId', 'reason']), 'write', true),
      action('Log trigger reason', 'create_contact_note', { contactId: args.contactId, body: args.reason }, 'write', true),
    ],
  },
  {
    name: 'crm_reputation_workspace',
    title: 'Open Reputation Workspace Data',
    description: 'Gather reviews, reputation stats, review requests, and connected platform context.',
    app: 'reputation-center',
    access: 'read',
    readPlan: [
      { label: 'Reviews', tool: 'get_reviews', method: 'GET', path: (_args, locationId) => `/reputation/reviews?locationId=${enc(locationId)}` },
      { label: 'Review stats', tool: 'get_review_stats', method: 'GET', path: (_args, locationId) => `/reputation/stats?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_review_reply',
    title: 'Prepare Review Reply',
    description: 'Prepare a public review reply with confirmation before posting.',
    app: 'reputation-center',
    access: 'write',
    inputProperties: { reviewId: { type: 'string' }, reply: { type: 'string' }, tone: { type: 'string' } },
    required: ['reviewId', 'reply'],
    buildActions: (args) => [action('Publish review reply', 'reply_to_review', pick(args, ['reviewId', 'reply']), 'write', true)],
  },
  {
    name: 'crm_prepare_review_request',
    title: 'Prepare Review Request',
    description: 'Prepare a review request message for a contact, staged before sending.',
    app: 'reputation-center',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, channel: { type: 'string' } },
    required: ['contactId'],
    buildActions: (args) => [action('Send review request', 'send_review_request', pick(args, ['contactId', 'message', 'channel']), 'write', true)],
  },
  {
    name: 'crm_prepare_review_request_batch',
    title: 'Prepare Review Request Batch',
    description: 'Prepare review requests for multiple contacts with one confirmation-gated batch plan.',
    app: 'reputation-center',
    access: 'write',
    inputProperties: { contactIds: { type: 'array', items: { type: 'string' } }, message: { type: 'string' }, channel: { type: 'string' } },
    required: ['contactIds'],
    buildActions: (args) => arrayArg(args.contactIds).map((contactId) => action(`Send review request to ${contactId}`, 'send_review_request', { contactId, message: args.message, channel: args.channel }, 'write', true)),
  },
  {
    name: 'crm_ads_workspace',
    title: 'Open Ads Workspace Data',
    description: 'Gather ads, attribution, funnel, conversion, and setup health reporting.',
    app: 'ads-dashboard',
    access: 'read',
    inputProperties: { startDate: { type: 'string' }, endDate: { type: 'string' }, channel: { type: 'string' } },
    buildActions: (args, locationId) => [
      action('Get ad reports', 'get_ad_reports', { locationId, startDate: args.startDate, endDate: args.endDate, channel: args.channel }, 'read', false),
      action('Get attribution report', 'get_attribution_report', { locationId, startDate: args.startDate, endDate: args.endDate }, 'read', false),
      action('Audit ads setup', 'audit_location_ads_setup', { locationId }, 'read', false),
    ],
  },
  {
    name: 'crm_prepare_ad_campaign_status',
    title: 'Prepare Ad Campaign Status Change',
    description: 'Prepare a paid campaign pause/resume/status change with explicit confirmation.',
    app: 'ads-dashboard',
    access: 'write',
    inputProperties: { platform: { type: 'string' }, campaignId: { type: 'string' }, status: { type: 'string' }, reason: { type: 'string' } },
    required: ['platform', 'campaignId', 'status'],
    buildActions: (args) => [action('Change campaign status', adStatusTool(args), pick(args, ['campaignId', 'status', 'reason']), 'write', true)],
  },
  {
    name: 'crm_billing_workspace',
    title: 'Open Billing Workspace Data',
    description: 'Gather invoices, estimates, orders, transactions, subscriptions, products, and coupons.',
    app: 'billing-commerce',
    access: 'read',
    readPlan: [
      { label: 'Invoices', tool: 'list_invoices', method: 'GET', path: (_args, locationId) => `/invoices/?locationId=${enc(locationId)}` },
      { label: 'Orders', tool: 'list_orders', method: 'GET', path: (_args, locationId) => `/payments/orders?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_invoice',
    title: 'Prepare Invoice',
    description: 'Prepare an invoice create/send flow with confirmation before creating or sending billing records.',
    app: 'billing-commerce',
    access: 'write',
    inputProperties: { contactId: CONTACT_FIELDS.contactId, invoiceId: { type: 'string' }, amount: { type: 'number' }, memo: { type: 'string' }, sendNow: { type: 'boolean' } },
    required: ['contactId'],
    buildActions: (args) => [
      action('Create invoice', 'create_invoice', pick(args, ['contactId', 'amount', 'memo']), 'write', true),
      action('Send invoice', 'send_invoice', { invoiceId: args.invoiceId }, 'write', true),
    ],
  },
  {
    name: 'crm_prepare_invoice_followup',
    title: 'Prepare Invoice Follow-Up',
    description: 'Prepare an invoice follow-up with invoice context, contact note, task, and optional SMS/email reminder.',
    app: 'billing-commerce',
    access: 'write',
    inputProperties: { invoiceId: { type: 'string' }, contactId: CONTACT_FIELDS.contactId, message: { type: 'string' }, channel: { type: 'string', enum: ['sms', 'email'] }, subject: { type: 'string' }, taskTitle: { type: 'string' } },
    required: ['invoiceId', 'contactId'],
    buildActions: (args) => [
      action('Load invoice', 'get_invoice', { invoiceId: args.invoiceId }, 'read', false),
      action('Add invoice follow-up note', 'create_contact_note', { contactId: args.contactId, body: args.message || 'Invoice follow-up prepared.' }, 'write', true),
      action('Create invoice follow-up task', 'create_contact_task', { contactId: args.contactId, title: args.taskTitle || 'Invoice follow-up' }, 'write', true),
      action('Draft invoice reminder', stringArg(args.channel) === 'email' ? 'send_email' : 'send_sms', pick(args, ['contactId', 'subject', 'message']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_payment_record',
    title: 'Prepare Payment Record',
    description: 'Prepare an order payment record or invoice payment action with confirmation.',
    app: 'billing-commerce',
    access: 'write',
    inputProperties: { orderId: { type: 'string' }, invoiceId: { type: 'string' }, amount: { type: 'number' }, note: { type: 'string' } },
    buildActions: (args) => [action('Record payment', 'record_order_payment', pick(args, ['orderId', 'invoiceId', 'amount', 'note']), 'write', true)],
  },
  {
    name: 'crm_agency_admin_workspace',
    title: 'Open Agency Admin Workspace Data',
    description: 'Gather locations, users, snapshots, phone numbers, media, and setup health context for an agency account.',
    app: 'agency-admin',
    access: 'read',
    readPlan: [
      { label: 'Locations', tool: 'search_locations', method: 'GET', path: () => '/locations/search' },
      { label: 'Users', tool: 'search_users', method: 'GET', path: (_args, locationId) => `/users/search?locationId=${enc(locationId)}` },
      { label: 'Snapshots', tool: 'get_snapshots', method: 'GET', path: () => '/snapshots/' },
    ],
  },
  {
    name: 'crm_location_health_check',
    title: 'Run Location Health Check',
    description: 'Prepare a read-only setup audit covering contacts, users, calendars, phone, custom fields, workflows, ads, and billing readiness.',
    app: 'agency-admin',
    access: 'read',
    buildActions: (_args, locationId) => [
      action('Get location', 'get_location', { locationId }, 'read', false),
      action('Search users', 'search_users', { locationId }, 'read', false),
      action('Get calendars', 'get_calendars', { locationId }, 'read', false),
      action('Get custom fields', 'get_location_custom_fields', { locationId }, 'read', false),
      action('Get phone numbers', 'get_phone_numbers', { locationId }, 'read', false),
      action('Audit ads setup', 'audit_location_ads_setup', { locationId }, 'read', false),
    ],
  },
  {
    name: 'crm_prepare_snapshot_rollout',
    title: 'Prepare Snapshot Rollout',
    description: 'Prepare a snapshot rollout to one or more subaccounts with status checks and explicit confirmation.',
    app: 'agency-admin',
    access: 'write',
    inputProperties: { snapshotId: { type: 'string' }, locationIds: { type: 'array', items: { type: 'string' } }, rolloutNote: { type: 'string' } },
    required: ['snapshotId', 'locationIds'],
    buildActions: (args) => [
      action('Check latest snapshot push', 'get_latest_snapshot_push', { snapshotId: args.snapshotId }, 'read', false),
      action('Push snapshot', 'push_snapshot_to_subaccounts', pick(args, ['snapshotId', 'locationIds', 'rolloutNote']), 'write', true),
    ],
  },
  {
    name: 'crm_prepare_user_invite',
    title: 'Prepare User Invite',
    description: 'Prepare a user invite or user update for a location with confirmation.',
    app: 'agency-admin',
    access: 'write',
    inputProperties: { locationId: { type: 'string' }, email: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, role: { type: 'string' } },
    required: ['email'],
    buildActions: (args, locationId) => [action('Create user', 'create_user', { locationId: stringArg(args.locationId) || locationId, ...pick(args, ['email', 'firstName', 'lastName', 'role']) }, 'write', true)],
  },
  // ─── CRM Builder: configure a sub-account (calendars, fields, widgets…) ───
  {
    name: 'crm_builder_workspace',
    title: 'Open CRM Builder Workspace',
    description: 'Gather a sub-account\'s configuration surface for build-out work: calendars, forms, custom fields, custom values, tags, pipelines, chat widgets, and funnels. Pass audit: true for a custom-field usage audit (scans all contacts, reports used vs unused fields — deletes nothing).',
    app: 'crm-builder',
    access: 'read',
    inputProperties: {
      audit: { type: 'boolean', description: 'Run the custom-field usage audit instead of the standard reads.' },
      triggerLink: { type: 'object', description: 'Stage a trigger-link create ({name, url}) or update ({linkId, name, url}). Executes only when executeConfirmed is true after user approval. Temporary alias for crm_prepare_trigger_link for clients with cached tool lists.' },
      deleteFields: { type: 'array', items: { type: 'string' }, description: 'DESTRUCTIVE: custom field ids to bulk-delete. Stages a preview; executes only with executeConfirmed: true after explicit user approval of the vetted list.' },
    },
    readPlan: [
      { label: 'Calendars', tool: 'get_calendars', method: 'GET', version: '2021-04-15', path: (_a, locationId) => `/calendars/?locationId=${enc(locationId)}` },
      { label: 'Forms', tool: 'get_forms', method: 'GET', path: (_a, locationId) => `/forms/?locationId=${enc(locationId)}` },
      { label: 'Custom fields', tool: 'get_custom_fields', method: 'GET', path: (_a, locationId) => `/locations/${enc(locationId)}/customFields` },
      { label: 'Custom values', tool: 'get_custom_values', method: 'GET', path: (_a, locationId) => `/locations/${enc(locationId)}/customValues` },
      { label: 'Tags', tool: 'get_tags', method: 'GET', path: (_a, locationId) => `/locations/${enc(locationId)}/tags` },
      { label: 'Pipelines', tool: 'get_pipelines', method: 'GET', path: (_a, locationId) => `/opportunities/pipelines?locationId=${enc(locationId)}` },
      { label: 'Chat widgets', tool: 'list_chat_widgets', method: 'GET', version: 'v3', path: (_a, locationId) => `/chat-widget/list?locationId=${enc(locationId)}&offset=0&limit=50` },
      { label: 'Funnels', tool: 'list_funnels', method: 'GET', path: (_a, locationId) => `/funnels/funnel/list?locationId=${enc(locationId)}` },
      { label: 'Trigger links', tool: 'get_links', method: 'GET', path: (_a, locationId) => `/links/?locationId=${enc(locationId)}` },
    ],
  },
  {
    name: 'crm_prepare_trigger_link',
    title: 'Prepare Trigger Link Create/Update/Delete',
    description: 'Stage a trigger link create (no linkId), update (linkId — e.g. swap the destination URL before an event), or delete (linkId + delete: true). Workflows reference the link entity, so updating its URL updates every workflow that sends it. Re-call with executeConfirmed: true after the user approves.',
    app: 'crm-builder',
    access: 'write',
    inputProperties: {
      linkId: { type: 'string', description: 'Existing trigger link to update or delete; omit to create.' },
      name: { type: 'string' },
      url: { type: 'string', description: 'Destination URL (redirectTo).' },
      delete: { type: 'boolean', description: 'With linkId: delete the trigger link. Destructive.' },
    },
    required: ['name'],
    writePlan: [
      { label: 'Create trigger link', method: 'POST', path: (args) => stringArg(args.linkId) ? undefined : '/links/', body: (args, locationId) => ({ locationId, name: args.name, redirectTo: args.url }) },
      { label: 'Update trigger link', method: 'PUT', path: (args) => (stringArg(args.linkId) && !args.delete) ? `/links/${stringArg(args.linkId)}` : undefined, body: (args) => ({ name: args.name, redirectTo: args.url }) },
      { label: 'Delete trigger link', method: 'DELETE', destructive: true, path: (args) => (stringArg(args.linkId) && args.delete) ? `/links/${stringArg(args.linkId)}` : undefined },
    ],
  },
  {
    name: 'crm_prepare_calendar',
    title: 'Prepare Calendar Create/Update',
    description: 'Stage a calendar create (no calendarId) or update (with calendarId). Pass calendar settings in the "calendar" object per the GHL calendar schema (name, slug, slotDuration, etc.). Re-call with executeConfirmed: true after the user approves.',
    app: 'crm-builder',
    access: 'write',
    inputProperties: {
      calendarId: { type: 'string', description: 'Existing calendar to update; omit to create.' },
      calendar: { type: 'object', description: 'Calendar fields per the GHL calendars API (name, description, slug, slotDuration, calendarType, teamMembers, etc.).' },
    },
    required: ['calendar'],
    writePlan: [
      { label: 'Create calendar', method: 'POST', version: '2021-04-15', path: (args) => stringArg(args.calendarId) ? undefined : '/calendars/', body: (args, locationId) => ({ locationId, ...(args.calendar as JsonRecord || {}) }) },
      { label: 'Update calendar', method: 'PUT', version: '2021-04-15', path: (args) => stringArg(args.calendarId) ? `/calendars/${stringArg(args.calendarId)}` : undefined, body: (args) => ({ ...(args.calendar as JsonRecord || {}) }) },
    ],
  },
  {
    name: 'crm_prepare_custom_field',
    title: 'Prepare Custom Field Create/Update',
    description: 'Stage a location custom-field create (no fieldId) or update (with fieldId). Re-call with executeConfirmed: true after the user approves.',
    app: 'crm-builder',
    access: 'write',
    inputProperties: {
      fieldId: { type: 'string', description: 'Existing custom field to update; omit to create.' },
      name: { type: 'string' },
      dataType: { type: 'string', description: 'e.g. TEXT, LARGE_TEXT, NUMERICAL, PHONE, MONETORY, CHECKBOX, SINGLE_OPTIONS, MULTIPLE_OPTIONS, DATE, FILE_UPLOAD' },
      options: { type: 'array', items: { type: 'string' }, description: 'For option-type fields.' },
      field: { type: 'object', description: 'Additional custom-field properties merged into the payload (placeholder, position, model, etc.).' },
    },
    required: ['name'],
    writePlan: [
      { label: 'Create custom field', method: 'POST', path: (args, locationId) => stringArg(args.fieldId) ? undefined : `/locations/${enc(locationId)}/customFields`, body: (args) => compact({ name: args.name, dataType: args.dataType || 'TEXT', options: args.options, ...(args.field as JsonRecord || {}) }) },
      { label: 'Update custom field', method: 'PUT', path: (args, locationId) => stringArg(args.fieldId) ? `/locations/${enc(locationId)}/customFields/${stringArg(args.fieldId)}` : undefined, body: (args) => compact({ name: args.name, dataType: args.dataType, options: args.options, ...(args.field as JsonRecord || {}) }) },
    ],
  },
  {
    name: 'crm_prepare_custom_value',
    title: 'Prepare Custom Value Create/Update',
    description: 'Stage a location custom-value create (no valueId) or update (with valueId). Re-call with executeConfirmed: true after the user approves.',
    app: 'crm-builder',
    access: 'write',
    inputProperties: {
      valueId: { type: 'string', description: 'Existing custom value to update; omit to create.' },
      name: { type: 'string' },
      value: { type: 'string' },
    },
    required: ['name', 'value'],
    writePlan: [
      { label: 'Create custom value', method: 'POST', path: (args, locationId) => stringArg(args.valueId) ? undefined : `/locations/${enc(locationId)}/customValues`, body: (args) => ({ name: args.name, value: args.value }) },
      { label: 'Update custom value', method: 'PUT', path: (args, locationId) => stringArg(args.valueId) ? `/locations/${enc(locationId)}/customValues/${stringArg(args.valueId)}` : undefined, body: (args) => ({ name: args.name, value: args.value }) },
    ],
  },
  {
    name: 'crm_prepare_tag',
    title: 'Prepare Tag Create/Update/Delete',
    description: 'Stage a location tag create (no tagId), rename (tagId), or delete (tagId + delete: true — DESTRUCTIVE, removes the tag from all contacts). Re-call with executeConfirmed: true after the user approves.',
    app: 'crm-builder',
    access: 'write',
    inputProperties: {
      tagId: { type: 'string', description: 'Existing tag to rename or delete; omit to create.' },
      name: { type: 'string' },
      delete: { type: 'boolean', description: 'With tagId: delete the tag instead of renaming. Destructive.' },
    },
    required: ['name'],
    writePlan: [
      { label: 'Create tag', method: 'POST', path: (args, locationId) => stringArg(args.tagId) ? undefined : `/locations/${enc(locationId)}/tags`, body: (args) => ({ name: args.name }) },
      { label: 'Update tag', method: 'PUT', path: (args, locationId) => (stringArg(args.tagId) && !args.delete) ? `/locations/${enc(locationId)}/tags/${stringArg(args.tagId)}` : undefined, body: (args) => ({ name: args.name }) },
      { label: 'Delete tag', method: 'DELETE', destructive: true, path: (args, locationId) => (stringArg(args.tagId) && args.delete) ? `/locations/${enc(locationId)}/tags/${stringArg(args.tagId)}` : undefined },
    ],
  },
  {
    name: 'crm_prepare_chat_widget',
    title: 'Prepare Chat Widget Create/Update/Clone',
    description: 'Stage a chat-widget create (no widgetId), update (widgetId), or clone (widgetId + clone: true) using the v3 chat-widget API. Pass widget settings in the "widget" object. Re-call with executeConfirmed: true after the user approves.',
    app: 'crm-builder',
    access: 'write',
    inputProperties: {
      widgetId: { type: 'string', description: 'Existing widget to update or clone; omit to create.' },
      clone: { type: 'boolean', description: 'With widgetId: clone it instead of updating.' },
      widget: { type: 'object', description: 'Widget fields per the GHL v3 chat-widget schema (name, chatType, appearance, prompts, etc.).' },
    },
    writePlan: [
      { label: 'Create chat widget', method: 'POST', version: 'v3', path: (args) => stringArg(args.widgetId) ? undefined : '/chat-widget/', body: (args, locationId) => ({ locationId, ...(args.widget as JsonRecord || {}) }) },
      { label: 'Clone chat widget', method: 'POST', version: 'v3', path: (args) => (stringArg(args.widgetId) && args.clone) ? '/chat-widget/clone' : undefined, body: (args, locationId) => ({ locationId, widgetId: stringArg(args.widgetId), ...(args.widget as JsonRecord || {}) }) },
      { label: 'Update chat widget', method: 'PATCH', version: 'v3', path: (args, locationId) => (stringArg(args.widgetId) && !args.clone) ? `/chat-widget/data/${enc(locationId)}/${stringArg(args.widgetId)}` : undefined, body: (args) => ({ ...(args.widget as JsonRecord || {}) }) },
    ],
  },
];

export class AgentWorkspaceTools {
  /**
   * Executes a raw tool by name regardless of the active profile. Wired by the
   * ToolRegistry so confirmation-gated actions staged by prepare_* tools can
   * actually run when the user approves (executeConfirmed: true).
   */
  private rawExecutor?: (name: string, args: JsonRecord) => Promise<unknown>;

  constructor(private ghlClient: GHLApiClient) {}

  setRawExecutor(executor: (name: string, args: JsonRecord) => Promise<unknown>): void {
    this.rawExecutor = executor;
  }

  getToolDefinitions(): Tool[] {
    return WORKSPACE_SPECS.map((spec) => ({
      name: spec.name,
      description: spec.description,
      inputSchema: {
        type: 'object',
        properties: {
          locationId: { type: 'string', description: 'GHL location/subaccount ID. Defaults to configured GHL_LOCATION_ID.' },
          executeConfirmed: { type: 'boolean', description: 'Set true ONLY after the user has explicitly confirmed the staged actions; the tool then executes the writes and reports per-action results. Omit to stage a preview.' },
          ...(spec.inputProperties || {}),
        },
        required: spec.required || [],
      },
      _meta: {
        labels: {
          category: 'agent-workspace',
          access: spec.access,
          complexity: 'workflow',
          source: 'curated-agent-workspace',
          app: spec.app,
        },
        workflow: {
          app: spec.app,
          confirmationRequired: spec.access === 'write',
          exposesRawActions: true,
        },
      },
    }));
  }

  async handleToolCall(name: string, args: JsonRecord = {}): Promise<unknown> {
    const spec = WORKSPACE_SPECS.find((item) => item.name === name);
    if (!spec) throw new Error(`Unknown agent workspace tool: ${name}`);
    if (name === 'crm_list_workspaces') return this.listWorkspaces();

    const locationId = locationArg(args, this.ghlClient.getConfig().locationId);
    const confirmed = args.executeConfirmed === true;

    // Custom-field usage audit: which of the location's custom fields actually
    // carry values on contacts. Read-only; produces deletion CANDIDATES only.
    if (name === 'crm_builder_workspace' && args.audit) {
      return this.customFieldAudit(locationId);
    }

    // DESTRUCTIVE bulk custom-field deletion. Requires an explicit id list AND
    // executeConfirmed — stages a count preview otherwise.
    if (name === 'crm_builder_workspace' && Array.isArray(args.deleteFields)) {
      const ids = (args.deleteFields as unknown[]).map(String).filter(Boolean);
      if (!confirmed) {
        return {
          workflow: { name, title: 'Stage Custom Field Deletion', app: spec.app, access: 'write' },
          summary: `Staged deletion of ${ids.length} custom fields for confirmation.`,
          locationId,
          confirmationRequired: true,
          stagedActions: [{ label: `Delete ${ids.length} custom fields`, method: 'DELETE', destructive: true, ids }],
          nextSteps: ['Show the count and sample to the user.', 'After explicit confirmation, call again with executeConfirmed: true.'],
        };
      }
      const result = await this.deleteCustomFields(locationId, ids);
      return {
        workflow: { name, title: 'Delete Custom Fields', app: spec.app, access: 'write' },
        summary: `Deleted ${(result as any).deleted}/${ids.length} custom fields.`,
        locationId,
        ...(result as object),
      };
    }

    // Temporary bridge: trigger-link create/update via the builder workspace,
    // for MCP clients whose cached tool list predates crm_prepare_trigger_link.
    if (name === 'crm_builder_workspace' && args.triggerLink && typeof args.triggerLink === 'object') {
      const tl = args.triggerLink as JsonRecord;
      const linkId = stringArg(tl.linkId);
      const method = linkId ? 'PUT' : 'POST';
      const path = linkId ? `/links/${linkId}` : '/links/';
      const body = linkId ? { name: tl.name, redirectTo: tl.url } : { locationId, name: tl.name, redirectTo: tl.url };
      if (!confirmed) {
        return {
          workflow: { name, title: 'Stage Trigger Link', app: spec.app, access: 'write' },
          summary: 'Staged 1 write action for confirmation.',
          locationId,
          confirmationRequired: true,
          stagedActions: [{ label: linkId ? 'Update trigger link' : 'Create trigger link', method, path, body }],
          nextSteps: ['Show the staged action to the user.', 'After explicit confirmation, call again with executeConfirmed: true.'],
        };
      }
      try {
        const response = await this.ghlClient.makeRequest(method as any, path, body);
        return {
          workflow: { name, title: 'Trigger Link', app: spec.app, access: 'write' },
          summary: response.success ? 'Trigger link saved.' : 'Trigger link save failed.',
          locationId,
          executed: [{ label: linkId ? 'Update trigger link' : 'Create trigger link', method, path, success: response.success, data: response.success ? summarizeData(response.data) : undefined, error: response.success ? undefined : response.error }],
        };
      } catch (error) {
        return {
          workflow: { name, title: 'Trigger Link', app: spec.app, access: 'write' },
          summary: 'Trigger link save failed.',
          locationId,
          executed: [{ label: 'Trigger link', method, path, success: false, error: error instanceof Error ? error.message : String(error) }],
        };
      }
    }

    // Temporary bridge: widget PATCH via the conversation workspace, for MCP
    // clients whose cached tool list predates crm_prepare_chat_widget. Same
    // staging + executeConfirmed contract as writePlan tools.
    if (name === 'crm_conversation_workspace' && args.widgetPatch && typeof args.widgetPatch === 'object') {
      const widgetId = stringArg(args.widgetId);
      if (!widgetId) {
        return { workflow: { name, title: spec.title, app: spec.app, access: 'write' }, summary: 'widgetPatch requires widgetId.', locationId };
      }
      const path = `/chat-widget/data/${enc(locationId)}/${widgetId}`;
      if (!confirmed) {
        return {
          workflow: { name, title: 'Stage Chat Widget Patch', app: spec.app, access: 'write' },
          summary: 'Staged 1 write action for confirmation.',
          locationId,
          confirmationRequired: true,
          stagedActions: [{ label: 'Patch chat widget', method: 'PATCH', path, body: args.widgetPatch }],
          nextSteps: ['Show the staged action to the user.', 'After explicit confirmation, call again with executeConfirmed: true.'],
        };
      }
      try {
        const response = await this.ghlClient.makeRequest('PATCH', path, args.widgetPatch as JsonRecord, { version: 'v3' });
        return {
          workflow: { name, title: 'Patch Chat Widget', app: spec.app, access: 'write' },
          summary: response.success ? 'Chat widget patched.' : 'Chat widget patch failed.',
          locationId,
          executed: [{ label: 'Patch chat widget', method: 'PATCH', path, success: response.success, data: response.success ? summarizeData(response.data) : undefined, error: response.success ? undefined : response.error }],
        };
      } catch (error) {
        return {
          workflow: { name, title: 'Patch Chat Widget', app: spec.app, access: 'write' },
          summary: 'Chat widget patch failed.',
          locationId,
          executed: [{ label: 'Patch chat widget', method: 'PATCH', path, success: false, error: error instanceof Error ? error.message : String(error) }],
        };
      }
    }

    // Endpoint-level staged writes (crm-builder tools).
    if (spec.writePlan) {
      const applicable = spec.writePlan
        .map((item) => ({ item, path: item.path(args, locationId) }))
        .filter((x): x is { item: NonNullable<WorkspaceToolSpec['writePlan']>[number]; path: string } => !!x.path);
      if (!applicable.length) {
        return { workflow: { name: spec.name, title: spec.title, app: spec.app, access: spec.access }, summary: 'No applicable action for the provided arguments.', locationId };
      }
      if (!confirmed) {
        return {
          workflow: { name: spec.name, title: spec.title, app: spec.app, access: spec.access },
          summary: `${spec.title} staged ${applicable.length} write action${applicable.length === 1 ? '' : 's'} for confirmation.`,
          locationId,
          confirmationRequired: true,
          stagedActions: applicable.map(({ item, path }) => ({ label: item.label, method: item.method, path, body: item.body?.(args, locationId), destructive: !!item.destructive })),
          nextSteps: ['Show the staged action(s) to the user.', 'After the user explicitly confirms, call this tool again with the same arguments plus executeConfirmed: true.'],
        };
      }
      const executed = [] as unknown[];
      for (const { item, path } of applicable) {
        try {
          const response = await this.ghlClient.makeRequest(item.method as any, path, item.body?.(args, locationId), item.version ? { version: item.version } : undefined);
          executed.push({ label: item.label, method: item.method, path, success: response.success, data: response.success ? summarizeData(response.data) : undefined, error: response.success ? undefined : response.error });
        } catch (error) {
          executed.push({ label: item.label, method: item.method, path, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
      const okCount = executed.filter((x: any) => x.success).length;
      return {
        workflow: { name: spec.name, title: spec.title, app: spec.app, access: spec.access },
        summary: `${spec.title} executed ${okCount}/${executed.length} action${executed.length === 1 ? '' : 's'}.`,
        locationId,
        executed,
      };
    }

    const proposedActions = compactActions(spec.buildActions?.(args, locationId) || actionsFromReadPlan(spec, args, locationId));
    const readResults = spec.readPlan ? await this.runReadPlan(spec, args, locationId) : [];

    // Confirmed execution of staged raw-tool actions (existing prepare_* tools).
    if (confirmed && spec.access === 'write') {
      const writes = proposedActions.filter((item) => item.requiresConfirmation && Object.keys(item.arguments).length > 0);
      if (!this.rawExecutor) {
        return { workflow: { name: spec.name, title: spec.title, app: spec.app, access: spec.access }, summary: 'Execution is not available on this server build.', locationId };
      }
      const executed = [] as unknown[];
      for (const item of writes) {
        try {
          const result = await this.rawExecutor(item.tool, item.arguments);
          if (result === undefined) {
            executed.push({ label: item.label, tool: item.tool, success: false, error: `Unknown raw tool: ${item.tool}` });
          } else {
            executed.push({ label: item.label, tool: item.tool, success: true, data: summarizeData(result) });
          }
        } catch (error) {
          executed.push({ label: item.label, tool: item.tool, success: false, error: error instanceof Error ? error.message : String(error) });
        }
      }
      const okCount = executed.filter((x: any) => x.success).length;
      return {
        workflow: { name: spec.name, title: spec.title, app: spec.app, access: spec.access },
        summary: `${spec.title} executed ${okCount}/${executed.length} confirmed action${executed.length === 1 ? '' : 's'}.`,
        locationId,
        executed,
      };
    }

    // Read-plan workspaces: the proposed actions just mirror the reads that
    // already ran, so echoing them (plus boilerplate next steps) is noise for
    // the calling agent. Return the lean envelope. Write/prepare tools — and
    // read tools whose buildActions ARE the product (e.g. crm_get_next_page) —
    // keep the full staging envelope.
    if (spec.access === 'read' && spec.readPlan && !spec.buildActions) {
      return {
        workflow: { name: spec.name, title: spec.title, app: spec.app, access: spec.access },
        summary: summarize(spec, proposedActions),
        locationId,
        readResults,
        resultSummary: resultSummary(readResults, proposedActions),
      };
    }

    return {
      workflow: {
        name: spec.name,
        title: spec.title,
        app: spec.app,
        access: spec.access,
      },
      summary: summarize(spec, proposedActions),
      locationId,
      confirmationRequired: proposedActions.some((item) => item.requiresConfirmation),
      readResults,
      resultSummary: resultSummary(readResults, proposedActions),
      proposedActions,
      executeToolCalls: proposedActions
        .filter((item) => item.requiresConfirmation)
        .map(({ tool, arguments: toolArgs }) => ({ tool, arguments: toolArgs })),
      nextSteps: spec.access === 'write'
        ? ['Review the proposed actions.', 'Ask the user to confirm the specific writes.', 'Execute the listed raw tools only after confirmation.']
        : ['Use the returned context to decide whether a write-preparation workflow is needed.'],
    };
  }

  private listWorkspaces(): unknown {
    const grouped = new Map<string, WorkspaceToolSpec[]>();
    for (const spec of WORKSPACE_SPECS.filter((item) => item.name !== 'crm_list_workspaces')) {
      grouped.set(spec.app, [...(grouped.get(spec.app) || []), spec]);
    }

    return {
      summary: 'Curated GHL CRM tools for agents. Prefer these workflow tools for chat-driven CRM work; fall back to raw endpoint tools for advanced edge cases.',
      workspaces: [...grouped.entries()].map(([app, tools]) => ({
        app,
        readTools: tools.filter((tool) => tool.access === 'read').map((tool) => tool.name),
        writePreparationTools: tools.filter((tool) => tool.access === 'write').map((tool) => tool.name),
      })),
      // Resource-oriented coverage map: where each GHL API category is reachable
      // from the curated layer, so gaps are explicit instead of silent.
      apiCategoryCoverage: {
        'Contacts': 'contact-workspace',
        'Conversations': 'conversation-inbox',
        'Chat Widget': 'crm-builder (list/create/update/clone) + conversation-inbox (list)',
        'Calendars': 'appointment-desk (events) + crm-builder (calendar setup)',
        'Custom Fields V2': 'crm-builder',
        'Custom Values': 'crm-builder',
        'Tags': 'crm-builder',
        'Forms': 'crm-builder (list only — GHL API has no form create)',
        'Funnels': 'crm-builder (list only)',
        'Opportunities/Pipelines': 'pipeline-board',
        'Invoices/Payments': 'billing-commerce',
        'Reviews/Reputation': 'reputation-center',
        'Ad Manager': 'ads-dashboard',
        'Workflows': 'automation-launcher (list/enroll only — GHL API has no workflow create)',
        'Locations/Sub-accounts': 'agency-admin + agency selector tools',
        'SaaS (pause/enable)': 'agency selector tools (ghl_subaccount_status)',
        'Snapshots': 'agency-admin',
        'Users': 'agency-admin',
        'Email Templates': 'not covered (curated) — available in stable/full profiles',
        'Blogs': 'not covered (curated) — available in stable/full profiles',
        'Media Library': 'not covered (curated) — available in stable/full profiles',
        'Courses': 'not covered',
        'Brand Boards': 'not covered (newer API; ask to add)',
        'AI Agent Studio': 'not covered (newer API; ask to add)',
        'Conversation AI / Voice AI': 'not covered (newer API; ask to add)',
        'Knowledge Base': 'not covered (newer API; ask to add)',
      },
      profileHint: 'Set GHL_TOOL_PROFILE=curated to expose only these workflow tools to agents. Use full for all tools, or raw for endpoint-level tools without the curated layer.',
    };
  }

  /**
   * Scan every custom field definition against every contact's stored values.
   * Returns used fields (with counts + a sample value) and unused fields —
   * candidates for cleanup, pending human confirmation. Contact values are the
   * strongest usage signal, but fields may still be referenced by forms,
   * workflows, or calendars: the report says so explicitly.
   */
  private async customFieldAudit(locationId: string): Promise<unknown> {
    const loc = encodeURIComponent(locationId);
    const fieldsResp = await this.ghlClient.makeRequest('GET', `/locations/${loc}/customFields`);
    if (!fieldsResp.success) {
      return { audit: 'custom-fields', locationId, error: `Could not list custom fields: ${JSON.stringify(fieldsResp.error)}` };
    }
    const fields: any[] = (fieldsResp.data as any)?.customFields || [];

    // Form-usage signal: every form submission ever recorded reveals the fields
    // that form writes. (Form DEFINITIONS are not exposed by the public API, so
    // fields on never-submitted forms cannot be detected this way.)
    const submissionText: string[] = [];
    let submissionCount = 0;
    for (let page = 1; page <= 50; page++) {
      const resp = await this.ghlClient.makeRequest('GET', `/forms/submissions?locationId=${loc}&limit=100&page=${page}`);
      if (!resp.success) break;
      const subs: any[] = (resp.data as any)?.submissions || [];
      if (!subs.length) break;
      submissionCount += subs.length;
      submissionText.push(JSON.stringify(subs));
      if (subs.length < 100) break;
    }
    const usedInSubmissions = (f: any): boolean =>
      submissionText.some((chunk) => chunk.includes(f.id) || (f.fieldKey && chunk.includes(String(f.fieldKey).replace(/^contact\./, ''))));

    const usage = new Map<string, number>();
    const samples = new Map<string, string>();
    let scanned = 0;
    let pages = 0;
    let searchAfter: unknown;
    let partial = false;

    while (pages < 80) {
      const body: JsonRecord = { locationId, pageLimit: 100 };
      if (searchAfter) body.searchAfter = searchAfter;
      const resp = await this.ghlClient.makeRequest('POST', '/contacts/search', body);
      if (!resp.success) { partial = scanned > 0; break; }
      const contacts: any[] = (resp.data as any)?.contacts || [];
      for (const contact of contacts) {
        scanned++;
        for (const cf of contact.customFields || []) {
          const v = cf?.value;
          const empty = v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
          if (empty) continue;
          usage.set(cf.id, (usage.get(cf.id) || 0) + 1);
          if (!samples.has(cf.id)) {
            const text = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v);
            samples.set(cf.id, text.slice(0, 60));
          }
        }
      }
      pages++;
      if (contacts.length < 100) break;
      searchAfter = contacts[contacts.length - 1]?.searchAfter;
      if (!searchAfter) break;
    }
    if (pages >= 80) partial = true;

    const usedFields: any[] = [];
    const unusedFields: any[] = [];
    for (const f of fields) {
      const count = usage.get(f.id) || 0;
      const inForms = usedInSubmissions(f);
      const row = { name: f.name, fieldKey: f.fieldKey, dataType: f.dataType, id: f.id, standard: !!f.standard, usedInFormSubmissions: inForms };
      if (count > 0 || inForms) usedFields.push({ ...row, contactsWithValue: count, sample: samples.get(f.id) });
      else unusedFields.push(row);
    }
    usedFields.sort((a, b) => (b.contactsWithValue || 0) - (a.contactsWithValue || 0));

    return {
      audit: 'custom-fields',
      locationId,
      totalFields: fields.length,
      contactsScanned: scanned,
      scanComplete: !partial,
      formSubmissionsScanned: submissionCount,
      usedOnContactsOrForms: usedFields.length,
      unused: unusedFields.length,
      note: 'unused = no non-empty value on any scanned contact AND never seen in any form submission. Fields on never-submitted forms cannot be detected via API. This audit deletes nothing.',
      usedFields,
      unusedFields,
    };
  }

  /** Bulk-delete custom fields by id. DESTRUCTIVE — caller must have verified. */
  private async deleteCustomFields(locationId: string, ids: string[]): Promise<unknown> {
    const loc = encodeURIComponent(locationId);
    const results: any[] = [];
    for (const id of ids) {
      try {
        const resp = await this.ghlClient.makeRequest('DELETE', `/locations/${loc}/customFields/${encodeURIComponent(id)}`);
        results.push({ id, success: resp.success, error: resp.success ? undefined : resp.error });
      } catch (error) {
        results.push({ id, success: false, error: error instanceof Error ? error.message : String(error) });
      }
    }
    const ok = results.filter((r) => r.success).length;
    return { deleted: ok, failed: results.length - ok, results };
  }

  private async runReadPlan(spec: WorkspaceToolSpec, args: JsonRecord, locationId: string): Promise<unknown[]> {
    const plan = spec.readPlan || [];
    const results = await Promise.all(plan.map(async (item) => {
      const path = item.path(args, locationId);
      if (!path) return undefined;
      try {
        const response = await this.ghlClient.makeRequest(item.method, path, item.body?.(args, locationId), item.version ? { version: item.version } : undefined);
        return {
          label: item.label,
          tool: item.tool,
          path,
          success: response.success,
          data: response.success ? summarizeData(response.data) : undefined,
          error: response.success ? undefined : response.error,
        };
      } catch (error) {
        return {
          label: item.label,
          tool: item.tool,
          path,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }));
    return results.filter(Boolean);
  }
}

function action(label: string, tool: string, args: JsonRecord, risk: WorkflowAction['risk'], requiresConfirmation: boolean): WorkflowAction {
  return { label, tool, arguments: compact(args), risk, requiresConfirmation };
}

function actionsFromReadPlan(spec: WorkspaceToolSpec, args: JsonRecord, locationId: string): WorkflowAction[] {
  return (spec.readPlan || []).map((item) => action(item.label, item.tool, { path: item.path(args, locationId) }, 'read', false));
}

function compactActions(actions: WorkflowAction[]): WorkflowAction[] {
  return actions.filter((item) => Object.keys(item.arguments).length > 0 || item.risk === 'read');
}

function summarize(spec: WorkspaceToolSpec, actions: WorkflowAction[]): string {
  const writeCount = actions.filter((item) => item.requiresConfirmation).length;
  if (spec.access === 'read') return `${spec.title} prepared ${actions.length} read action${actions.length === 1 ? '' : 's'}.`;
  return `${spec.title} staged ${writeCount} confirmation-gated write action${writeCount === 1 ? '' : 's'} plus ${actions.length - writeCount} context action${actions.length - writeCount === 1 ? '' : 's'}.`;
}

function resultSummary(readResults: unknown[], actions: WorkflowAction[]): JsonRecord {
  const resultRecords = readResults.filter(isRecord);
  return {
    readResults: readResults.length,
    successfulReads: resultRecords.filter((item) => item.success === true).length,
    failedReads: resultRecords.filter((item) => item.success === false).length,
    readActions: actions.filter((item) => item.risk === 'read').length,
    writeActions: actions.filter((item) => item.requiresConfirmation).length,
    destructiveActions: actions.filter((item) => item.risk === 'destructive').length,
  };
}

// Trim long LISTS to keep envelopes lean, but never drop object keys — resource
// configs (widget settings, calendar configs) must round-trip losslessly or
// read-then-write flows silently destroy fields.
function summarizeData(data: unknown, depth = 0): unknown {
  const arrayCap = depth <= 1 ? 25 : 100;
  if (Array.isArray(data)) {
    return data.length > arrayCap
      ? { count: data.length, items: data.slice(0, arrayCap).map((v) => summarizeData(v, depth + 1)) }
      : data.map((v) => summarizeData(v, depth + 1));
  }
  if (!isRecord(data)) return data;
  const summary: JsonRecord = {};
  for (const [key, value] of Object.entries(data)) {
    summary[key] = summarizeData(value, depth + 1);
  }
  return summary;
}

function locationArg(args: JsonRecord, fallback: string): string {
  return stringArg(args.locationId) || fallback || '';
}

function stringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberArg(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function arrayArg(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function compact(args: JsonRecord): JsonRecord {
  return Object.fromEntries(Object.entries(args).filter(([, value]) => {
    if (value === undefined || value === null || value === '') return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  }));
}

function pick(args: JsonRecord, keys: string[]): JsonRecord {
  return compact(Object.fromEntries(keys.map((key) => [key, args[key]])));
}

function contactPayload(args: JsonRecord, locationId: string): JsonRecord {
  const fallbackName = stringArg(args.name);
  const [firstName, ...rest] = fallbackName ? fallbackName.split(' ') : [];
  return compact({
    locationId,
    firstName: args.firstName || firstName,
    lastName: args.lastName || rest.join(' '),
    email: args.email,
    phone: args.phone,
    source: args.source,
    tags: args.tags || ['lead'],
  });
}

function adStatusTool(args: JsonRecord): string {
  const platform = stringArg(args.platform)?.toLowerCase();
  const status = stringArg(args.status)?.toLowerCase();
  if (platform === 'google') return 'official_ad_manager_google_upsert_campaign';
  if (platform === 'linkedin' || platform === 'li') return 'official_ad_manager_li_update_ad_status';
  return status === 'active' || status === 'resume' ? 'official_ad_manager_fb_resume_campaign' : 'official_ad_manager_fb_pause_campaign';
}

function enc(value: unknown): string {
  return encodeURIComponent(String(value || ''));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
