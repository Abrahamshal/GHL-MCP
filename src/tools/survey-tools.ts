import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
import { 
  MCPGetSurveysParams,
  MCPGetSurveySubmissionsParams
} from '../types/ghl-types.js';

export class SurveyTools {
  constructor(private apiClient: GHLApiClient) {}

  getTools(): Tool[] {
    return [
      {
        name: 'ghl_get_surveys',
        description: 'Retrieve all surveys for a location. Surveys are used to collect information from contacts through forms and questionnaires.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'The location ID to get surveys for. If not provided, uses the default location from configuration.'
            },
            skip: {
              type: 'number',
              description: 'Number of records to skip for pagination (default: 0)'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of surveys to return (max: 50, default: 10)'
            },
            type: {
              type: 'string',
              description: 'Filter surveys by type (e.g., "folder")'
            },
          },
          additionalProperties: false
        },
        _meta: {
          labels: {
            category: "surveys",
            access: "read",
            complexity: "simple"
          }
        }
      },
      {
        name: 'ghl_get_survey_submissions',
        description: 'Retrieve survey submissions with advanced filtering and pagination. Get responses from contacts who have completed surveys.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'The location ID to get submissions for. If not provided, uses the default location from configuration.'
            },
            page: {
              type: 'number',
              description: 'Page number for pagination (default: 1)'
            },
            limit: {
              type: 'number',
              description: 'Number of submissions per page (max: 100, default: 20)'
            },
            surveyId: {
              type: 'string',
              description: 'Filter submissions by specific survey ID'
            },
            q: {
              type: 'string',
              description: 'Search by contact ID, name, email, or phone number'
            },
            startAt: {
              type: 'string',
              description: 'Start date for filtering submissions (YYYY-MM-DD format)'
            },
            endAt: {
              type: 'string',
              description: 'End date for filtering submissions (YYYY-MM-DD format)'
            },
          },
          additionalProperties: false
        },
        _meta: {
          labels: {
            category: "surveys",
            access: "read",
            complexity: "simple"
          }
        }
      },

      // ─── New Survey Tools ────────────────────────────────────────────────
      {
        name: 'ghl_create_survey',
        description: 'Create a new survey for a location. Returns the created survey with its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'The location ID to create the survey in. Uses default if not provided.'
            },
            name: {
              type: 'string',
              description: 'Display name for the survey'
            },
            fields: {
              type: 'array',
              description: 'Array of survey field/question objects',
              items: {
                type: 'object',
                properties: {
                  fieldKey: { type: 'string', description: 'Unique key for the field' },
                  label: { type: 'string', description: 'Question text shown to respondents' },
                  dataType: { type: 'string', description: 'Field type (e.g., TEXT, SINGLE_LINE, MULTI_LINE, DROPDOWN, RADIO, CHECKBOX)' },
                  required: { type: 'boolean', description: 'Whether this field is required' },
                  options: {
                    type: 'array',
                    items: { type: 'object' },
                    description: 'Options for DROPDOWN/RADIO/CHECKBOX fields'
                  }
                }
              }
            },
            thankYouMessage: {
              type: 'string',
              description: 'Message shown after submission'
            }
          },
          required: ['name'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'write', complexity: 'moderate' }
        }
      },
      {
        name: 'ghl_get_survey',
        description: 'Get details for a specific survey by its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID. Uses default if not provided.'
            },
            surveyId: {
              type: 'string',
              description: 'The unique ID of the survey to retrieve'
            }
          },
          required: ['surveyId'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'read', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_update_survey',
        description: 'Update survey configuration including name, fields, and thank-you message.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID. Uses default if not provided.'
            },
            surveyId: {
              type: 'string',
              description: 'The unique ID of the survey to update'
            },
            name: {
              type: 'string',
              description: 'New display name for the survey'
            },
            fields: {
              type: 'array',
              description: 'Updated array of survey field/question objects',
              items: { type: 'object' }
            },
            thankYouMessage: {
              type: 'string',
              description: 'Updated message shown after submission'
            }
          },
          required: ['surveyId'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'write', complexity: 'moderate' }
        }
      },
      {
        name: 'ghl_delete_survey',
        description: 'Permanently delete a survey and all its data. This action is irreversible.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID. Uses default if not provided.'
            },
            surveyId: {
              type: 'string',
              description: 'The unique ID of the survey to delete'
            }
          },
          required: ['surveyId'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'delete', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_list_survey_submissions',
        description: 'Get all submissions for a specific survey with filtering and pagination.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID. Uses default if not provided.'
            },
            surveyId: {
              type: 'string',
              description: 'The survey ID to get submissions for'
            },
            page: {
              type: 'number',
              description: 'Page number (default: 1)'
            },
            limit: {
              type: 'number',
              description: 'Submissions per page (max: 100, default: 20)'
            },
            startAt: {
              type: 'string',
              description: 'Start date filter (YYYY-MM-DD)'
            },
            endAt: {
              type: 'string',
              description: 'End date filter (YYYY-MM-DD)'
            }
          },
          required: ['surveyId'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'read', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_get_survey_submission',
        description: 'Get a single survey submission by its ID.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID. Uses default if not provided.'
            },
            surveyId: {
              type: 'string',
              description: 'The survey ID the submission belongs to'
            },
            submissionId: {
              type: 'string',
              description: 'The unique ID of the submission to retrieve'
            }
          },
          required: ['surveyId', 'submissionId'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'read', complexity: 'simple' }
        }
      },
      {
        name: 'ghl_get_survey_stats',
        description: 'Get analytics and statistics for a survey including response counts, completion rate, and field-level breakdowns.',
        inputSchema: {
          type: 'object',
          properties: {
            locationId: {
              type: 'string',
              description: 'Location ID. Uses default if not provided.'
            },
            surveyId: {
              type: 'string',
              description: 'The survey ID to get statistics for'
            },
            startDate: {
              type: 'string',
              description: 'Start of the reporting period (YYYY-MM-DD)'
            },
            endDate: {
              type: 'string',
              description: 'End of the reporting period (YYYY-MM-DD)'
            }
          },
          required: ['surveyId'],
          additionalProperties: false
        },
        _meta: {
          labels: { category: 'surveys', access: 'read', complexity: 'simple' }
        }
      }
    ];
  }

  async executeSurveyTool(name: string, params: any): Promise<any> {
    try {
      switch (name) {
        case 'ghl_get_surveys':
          return await this.getSurveys(params as MCPGetSurveysParams);
        
        case 'ghl_get_survey_submissions':
          return await this.getSurveySubmissions(params as MCPGetSurveySubmissionsParams);

        // ─── New Tools ──────────────────────────────────────────────────────
        case 'ghl_create_survey':
          return await this.createSurvey(params);

        case 'ghl_get_survey':
          return await this.getSurveyById(params);

        case 'ghl_update_survey':
          return await this.updateSurvey(params);

        case 'ghl_delete_survey':
          return await this.deleteSurvey(params);

        case 'ghl_list_survey_submissions':
          return await this.listSurveySubmissions(params);

        case 'ghl_get_survey_submission':
          return await this.getSurveySubmission(params);

        case 'ghl_get_survey_stats':
          return await this.getSurveyStats(params);

        default:
          throw new Error(`Unknown survey tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing survey tool ${name}:`, error);
      throw error;
    }
  }

  // ===== SURVEY MANAGEMENT TOOLS =====

  /**
   * Get all surveys for a location
   */
  private async getSurveys(params: MCPGetSurveysParams): Promise<any> {
    try {
      const result = await this.apiClient.getSurveys({
        locationId: params.locationId || '',
        skip: params.skip,
        limit: params.limit,
        type: params.type
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to get surveys: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        surveys: result.data.surveys,
        total: result.data.total,
        message: `Successfully retrieved ${result.data.surveys.length} surveys`,
        metadata: {
          totalSurveys: result.data.total,
          returnedCount: result.data.surveys.length,
          pagination: {
            skip: params.skip || 0,
            limit: params.limit || 10
          },
          ...(params.type && { filterType: params.type })
        }
      };
    } catch (error) {
      console.error('Error getting surveys:', error);
      throw new Error(`Failed to get surveys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get survey submissions with filtering
   */
  private async getSurveySubmissions(params: MCPGetSurveySubmissionsParams): Promise<any> {
    try {
      const result = await this.apiClient.getSurveySubmissions({
        locationId: params.locationId || '',
        page: params.page,
        limit: params.limit,
        surveyId: params.surveyId,
        q: params.q,
        startAt: params.startAt,
        endAt: params.endAt
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to get survey submissions: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        submissions: result.data.submissions,
        meta: result.data.meta,
        message: `Successfully retrieved ${result.data.submissions.length} survey submissions`,
        metadata: {
          totalSubmissions: result.data.meta.total,
          returnedCount: result.data.submissions.length,
          pagination: {
            currentPage: result.data.meta.currentPage,
            nextPage: result.data.meta.nextPage,
            prevPage: result.data.meta.prevPage,
            limit: params.limit || 20
          },
          filters: {
            ...(params.surveyId && { surveyId: params.surveyId }),
            ...(params.q && { search: params.q }),
            ...(params.startAt && { startDate: params.startAt }),
            ...(params.endAt && { endDate: params.endAt })
          }
        }
      };
    } catch (error) {
      console.error('Error getting survey submissions:', error);
      throw new Error(`Failed to get survey submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ─── New Survey Handlers ─────────────────────────────────────────────────

  private async createSurvey(params: any): Promise<any> {
    const locationId = params.locationId || (this.apiClient as any).getConfig?.()?.locationId || '';
    const body: Record<string, unknown> = {
      name: params.name,
      ...(locationId && { locationId }),
      ...(params.fields && { fields: params.fields }),
      ...(params.thankYouMessage && { thankYouMessage: params.thankYouMessage }),
    };
    return (this.apiClient as any).makeRequest('POST', '/surveys/', body);
  }

  private async getSurveyById(params: any): Promise<any> {
    const locationId = params.locationId || (this.apiClient as any).getConfig?.()?.locationId || '';
    const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
    return (this.apiClient as any).makeRequest('GET', `/surveys/${params.surveyId}${qs}`);
  }

  private async updateSurvey(params: any): Promise<any> {
    const body: Record<string, unknown> = {};
    if (params.name !== undefined) body.name = params.name;
    if (params.fields !== undefined) body.fields = params.fields;
    if (params.thankYouMessage !== undefined) body.thankYouMessage = params.thankYouMessage;
    return (this.apiClient as any).makeRequest('PUT', `/surveys/${params.surveyId}`, body);
  }

  private async deleteSurvey(params: any): Promise<any> {
    const locationId = params.locationId || (this.apiClient as any).getConfig?.()?.locationId || '';
    const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
    return (this.apiClient as any).makeRequest('DELETE', `/surveys/${params.surveyId}${qs}`);
  }

  private async listSurveySubmissions(params: any): Promise<any> {
    const locationId = params.locationId || (this.apiClient as any).getConfig?.()?.locationId || '';
    const qp = new URLSearchParams();
    if (locationId) qp.append('locationId', locationId);
    if (params.page) qp.append('page', String(params.page));
    if (params.limit) qp.append('limit', String(params.limit));
    if (params.startAt) qp.append('startAt', params.startAt);
    if (params.endAt) qp.append('endAt', params.endAt);
    const qs = qp.toString();
    return (this.apiClient as any).makeRequest('GET', `/surveys/${params.surveyId}/submissions${qs ? `?${qs}` : ''}`);
  }

  private async getSurveySubmission(params: any): Promise<any> {
    const locationId = params.locationId || (this.apiClient as any).getConfig?.()?.locationId || '';
    const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : '';
    return (this.apiClient as any).makeRequest('GET', `/surveys/${params.surveyId}/submissions/${params.submissionId}${qs}`);
  }

  private async getSurveyStats(params: any): Promise<any> {
    const locationId = params.locationId || (this.apiClient as any).getConfig?.()?.locationId || '';
    const qp = new URLSearchParams();
    if (locationId) qp.append('locationId', locationId);
    if (params.startDate) qp.append('startDate', params.startDate);
    if (params.endDate) qp.append('endDate', params.endDate);
    const qs = qp.toString();
    return (this.apiClient as any).makeRequest('GET', `/surveys/${params.surveyId}/stats${qs ? `?${qs}` : ''}`);
  }
}

// Helper function to check if a tool name belongs to survey tools
export function isSurveyTool(toolName: string): boolean {
  const surveyToolNames = [
    'ghl_get_surveys',
    'ghl_get_survey_submissions',
    'ghl_create_survey',
    'ghl_get_survey',
    'ghl_update_survey',
    'ghl_delete_survey',
    'ghl_list_survey_submissions',
    'ghl_get_survey_submission',
    'ghl_get_survey_stats',
  ];
  
  return surveyToolNames.includes(toolName);
} 