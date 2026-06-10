import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UsersTools } from '../../src/tools/users-tools.js';

describe('UsersTools current CreateUserDto and UpdateUserDto fields', () => {
  let usersTools: UsersTools;
  let makeRequest: jest.Mock;

  beforeEach(() => {
    makeRequest = jest.fn(async () => ({ success: true, data: {} }));
    usersTools = new UsersTools({
      getConfig: () => ({
        accessToken: 'test',
        baseUrl: 'https://services.leadconnectorhq.com',
        version: '2023-02-21',
        locationId: 'default_location',
      }),
      makeRequest,
    });
  });

  it('documents current user create/update and search fields in tool schemas', () => {
    const tools = usersTools.getToolDefinitions();
    const getUsers = tools.find((tool) => tool.name === 'get_users') as any;
    const createUser = tools.find((tool) => tool.name === 'create_user') as any;
    const updateUser = tools.find((tool) => tool.name === 'update_user') as any;

    expect(Object.keys(getUsers.inputSchema.properties)).toEqual(expect.arrayContaining([
      'companyId',
      'enabled2waySync',
    ]));
    expect(Object.keys(createUser.inputSchema.properties)).toEqual(expect.arrayContaining([
      'twilioPhone',
      'locationIds',
      'profilePhoto',
      'platformLanguage',
      'scopes',
      'scopesAssignedToOnly',
    ]));
    expect(Object.keys(updateUser.inputSchema.properties)).toEqual(expect.arrayContaining([
      'twilioPhone',
      'locationIds',
      'profilePhoto',
      'platformLanguage',
      'scopes',
      'scopesAssignedToOnly',
    ]));
  });

  it('passes current CreateUserDto fields through to the API body', async () => {
    await usersTools.handleToolCall('create_user', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
      twilioPhone: '+15555550999',
      companyId: 'company_123',
      password: 'temporary-password',
      locationIds: ['loc_a', 'loc_b'],
      scopes: ['contacts.readonly', 'users.write'],
      scopesAssignedToOnly: ['users.write'],
      profilePhoto: 'https://example.com/ada.jpg',
      platformLanguage: 'en',
    });

    expect(makeRequest).toHaveBeenCalledWith('POST', '/users/', {
      locationId: 'default_location',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+15555550123',
      twilioPhone: '+15555550999',
      companyId: 'company_123',
      password: 'temporary-password',
      locationIds: ['loc_a', 'loc_b'],
      scopes: ['contacts.readonly', 'users.write'],
      scopesAssignedToOnly: ['users.write'],
      profilePhoto: 'https://example.com/ada.jpg',
      platformLanguage: 'en',
    });
  });

  it('passes current UpdateUserDto fields through to the API body', async () => {
    await usersTools.handleToolCall('update_user', {
      userId: 'user_123',
      firstName: 'Grace',
      twilioPhone: '+15555550000',
      companyId: 'company_123',
      password: 'new-temporary-password',
      locationIds: ['loc_c'],
      scopes: ['users.readonly'],
      scopesAssignedToOnly: ['users.readonly'],
      profilePhoto: 'https://example.com/grace.jpg',
      platformLanguage: 'es',
    });

    expect(makeRequest).toHaveBeenCalledWith('PUT', '/users/user_123', {
      firstName: 'Grace',
      twilioPhone: '+15555550000',
      companyId: 'company_123',
      password: 'new-temporary-password',
      locationIds: ['loc_c'],
      scopes: ['users.readonly'],
      scopesAssignedToOnly: ['users.readonly'],
      profilePhoto: 'https://example.com/grace.jpg',
      platformLanguage: 'es',
    });
  });
});
