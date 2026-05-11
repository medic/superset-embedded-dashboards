import axios from 'axios';
import { generateGuestToken, buildRlsClause, resetAuthCache } from '../superset';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('buildRlsClause', () => {
  it('builds equality clause from facility ID', () => {
    const clause = buildRlsClause('fac-001');
    expect(clause).toBe("chu_uuid = 'fac-001'");
  });

  it('rejects facility ID with SQL injection characters', () => {
    expect(() => buildRlsClause("fac'; DROP TABLE--"))
      .toThrow('Invalid facility_id format');
  });

  it('rejects empty string', () => {
    expect(() => buildRlsClause('')).toThrow('facility_id is required');
  });
});

describe('generateGuestToken', () => {
  const supersetUrl = 'https://superset.test.com';

  beforeEach(() => {
    jest.resetAllMocks();
    resetAuthCache();
  });

  it('authenticates to Superset, fetches CSRF token, and generates guest token', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'superset-access-token' },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { result: 'csrf-token-abc' },
      headers: { 'set-cookie': ['session=xyz; Path=/'] },
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'guest-jwt-token-123' },
    });

    const token = await generateGuestToken({
      supersetUrl,
      supersetUsername: 'admin',
      supersetPassword: 'secret',
      dashboardId: 'dash-uuid-1',
      facilityId: 'fac-001',
      username: 'cha_user',
    });

    expect(token).toBe('guest-jwt-token-123');

    // Step 1: login
    expect(mockedAxios.post).toHaveBeenNthCalledWith(1,
      'https://superset.test.com/api/v1/security/login',
      { username: 'admin', password: 'secret', provider: 'db', refresh: true }
    );

    // Step 2: CSRF token
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://superset.test.com/api/v1/security/csrf_token/',
      { headers: { Authorization: 'Bearer superset-access-token' } }
    );

    // Step 3: guest token with CSRF headers
    expect(mockedAxios.post).toHaveBeenNthCalledWith(2,
      'https://superset.test.com/api/v1/security/guest_token/',
      {
        user: { username: 'cha_user', first_name: 'cha_user', last_name: '' },
        resources: [{ type: 'dashboard', id: 'dash-uuid-1' }],
        rls: [{ clause: "chu_uuid = 'fac-001'" }],
      },
      {
        headers: {
          Authorization: 'Bearer superset-access-token',
          'X-CSRFToken': 'csrf-token-abc',
          Cookie: 'session=xyz; Path=/',
        },
      }
    );
  });

  it('throws when CSRF token fetch fails', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'superset-access-token' },
    });
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get.mockRejectedValueOnce(
      Object.assign(new Error('CSRF fetch failed'), { response: { status: 403, data: { message: 'Forbidden' } } })
    );

    await expect(generateGuestToken({
      supersetUrl,
      supersetUsername: 'admin',
      supersetPassword: 'secret',
      dashboardId: 'dash-uuid-1',
      facilityId: 'fac-001',
      username: 'cha_user',
    })).rejects.toThrow('CSRF fetch failed');
  });
});
