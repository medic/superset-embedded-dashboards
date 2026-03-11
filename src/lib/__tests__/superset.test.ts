import axios from 'axios';
import { generateGuestToken, buildRlsClause } from '../superset';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('buildRlsClause', () => {
  it('builds IN clause from facility IDs', () => {
    const clause = buildRlsClause(['fac-001', 'fac-002']);
    expect(clause).toBe("facility_id IN ('fac-001', 'fac-002')");
  });

  it('handles single facility ID', () => {
    const clause = buildRlsClause(['fac-001']);
    expect(clause).toBe("facility_id IN ('fac-001')");
  });

  it('rejects facility IDs with SQL injection characters', () => {
    expect(() => buildRlsClause(["fac'; DROP TABLE--"]))
      .toThrow('Invalid facility_id format');
  });

  it('rejects empty array', () => {
    expect(() => buildRlsClause([])).toThrow('At least one facility_id required');
  });
});

describe('generateGuestToken', () => {
  const supersetUrl = 'https://superset.test.com';

  afterEach(() => jest.resetAllMocks());

  it('authenticates to Superset and generates guest token', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'superset-access-token' },
    });
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'guest-jwt-token-123' },
    });

    const token = await generateGuestToken({
      supersetUrl,
      supersetUsername: 'admin',
      supersetPassword: 'secret',
      dashboardId: 'dash-uuid-1',
      facilityIds: ['fac-001'],
      username: 'cha_user',
    });

    expect(token).toBe('guest-jwt-token-123');
    expect(mockedAxios.post).toHaveBeenNthCalledWith(1,
      'https://superset.test.com/api/v1/security/login',
      { username: 'admin', password: 'secret', provider: 'db', refresh: true }
    );
    expect(mockedAxios.post).toHaveBeenNthCalledWith(2,
      'https://superset.test.com/api/v1/security/guest_token/',
      {
        user: { username: 'cha_user', first_name: 'cha_user', last_name: '' },
        resources: [{ type: 'dashboard', id: 'dash-uuid-1' }],
        rls: [{ clause: "facility_id IN ('fac-001')" }],
      },
      { headers: { Authorization: 'Bearer superset-access-token' } }
    );
  });
});
