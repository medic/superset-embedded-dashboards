import axios from 'axios';
import { authenticateCht, ChtUser } from '../cht-auth';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('authenticateCht', () => {
  const chtDomain = 'https://cht.test.com';

  afterEach(() => jest.resetAllMocks());

  it('returns user with facility_ids on successful auth', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      headers: { 'set-cookie': ['AuthSession=abc123; Path=/; HttpOnly'] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        name: 'cha_user',
        roles: ['chw'],
        facility_id: ['facility-001', 'facility-002'],
      },
    });

    const user = await authenticateCht(chtDomain, 'cha_user', 'password123');

    expect(user).toEqual({
      username: 'cha_user',
      facilityIds: ['facility-001', 'facility-002'],
      roles: ['chw'],
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://cht.test.com/_session',
      { name: 'cha_user', password: 'password123' },
      { auth: { username: 'cha_user', password: 'password123' } }
    );
  });

  it('handles facility_id as a single string', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      headers: { 'set-cookie': ['AuthSession=abc123; Path=/'] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { name: 'cha_user', roles: ['chw'], facility_id: 'facility-001' },
    });

    const user = await authenticateCht(chtDomain, 'cha_user', 'pass');
    expect(user.facilityIds).toEqual(['facility-001']);
  });

  it('throws on invalid credentials (401)', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });

    await expect(authenticateCht(chtDomain, 'bad', 'creds'))
      .rejects.toThrow('Invalid username or password');
  });

  it('throws if user has no facility_id', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      headers: { 'set-cookie': ['AuthSession=abc123; Path=/'] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { name: 'cha_user', roles: ['chw'], facility_id: [] },
    });

    await expect(authenticateCht(chtDomain, 'cha_user', 'pass'))
      .rejects.toThrow('No facilities assigned');
  });
});
