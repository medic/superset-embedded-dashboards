import axios from 'axios';

/**
 * Represents an authenticated CHT user with their assigned facilities and roles.
 *
 * @example
 * ```typescript
 * const user: ChtUser = {
 *   username: 'cha_jane',
 *   facilityId: 'facility-001',
 *   roles: ['chw'],
 * };
 * ```
 */
export interface ChtUser {
  username: string;
  facilityId: string;
  roles: string[];
}

/**
 * Authenticates a user against a CHT instance via CouchDB's `_session` endpoint,
 * then fetches the user doc to extract facility IDs and roles.
 *
 * @param chtDomain - The base URL of the CHT instance (e.g. "https://cht.example.com").
 * @param username - The CouchDB username.
 * @param password - The CouchDB password.
 * @returns The authenticated user's info including facility IDs and roles.
 * @throws Error with message "Invalid username or password" on 401 responses.
 * @throws Error with message "No facility assigned to this user" when the user has no facility_id.
 *
 * @example
 * ```typescript
 * const user = await authenticateCht('https://cht.example.com', 'cha_jane', 's3cret');
 * console.log(user.facilityId); // 'facility-001'
 * console.log(user.roles);      // ['chw']
 * ```
 */
export async function authenticateCht(
  chtDomain: string,
  username: string,
  password: string
): Promise<ChtUser> {
  let sessionCookie: string;
  try {
    const resp = await axios.post(
      `${chtDomain}/_session`,
      { name: username, password },
      { auth: { username, password } }
    );
    const setCookie = resp.headers['set-cookie'];
    const authCookie = setCookie?.find((c: string) => c.startsWith('AuthSession='));
    if (!authCookie) {
      throw new Error('No auth cookie received');
    }
    sessionCookie = authCookie.split(';')[0];
  } catch (err: unknown) {
    const errObj = err as { response?: { status?: number } };
    if (errObj?.response?.status === 401) {
      throw new Error('Invalid username or password');
    }
    throw err;
  }

  const userDocUrl = `${chtDomain}/medic/org.couchdb.user:${encodeURIComponent(username)}`;
  const { data: userDoc } = await axios.get(userDocUrl, {
    headers: { Cookie: sessionCookie },
  });

  const facilityId = [userDoc.facility_id].flat().filter(Boolean)[0];
  if (!facilityId) {
    throw new Error('No facility assigned to this user');
  }

  return {
    username: userDoc.name,
    facilityId,
    roles: userDoc.roles || [],
  };
}
