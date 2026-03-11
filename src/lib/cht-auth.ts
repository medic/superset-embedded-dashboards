import axios from 'axios';

/**
 * Represents an authenticated CHT user with their assigned facilities and roles.
 *
 * @example
 * ```typescript
 * const user: ChtUser = {
 *   username: 'cha_jane',
 *   facilityIds: ['facility-001', 'facility-002'],
 *   roles: ['chw'],
 * };
 * ```
 */
export interface ChtUser {
  username: string;
  facilityIds: string[];
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
 * @throws Error with message "No facilities assigned to this user" when the user has no facility_id.
 *
 * @example
 * ```typescript
 * const user = await authenticateCht('https://cht.example.com', 'cha_jane', 's3cret');
 * console.log(user.facilityIds); // ['facility-001']
 * console.log(user.roles);       // ['chw']
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
  } catch (err: any) {
    if (err?.response?.status === 401) {
      throw new Error('Invalid username or password');
    }
    throw err;
  }

  const userDocUrl = `${chtDomain}/medic/org.couchdb.user:${username}`;
  const { data: userDoc } = await axios.get(userDocUrl, {
    headers: { Cookie: sessionCookie },
  });

  const facilityIds = [userDoc.facility_id].flat().filter(Boolean);
  if (facilityIds.length === 0) {
    throw new Error('No facilities assigned to this user');
  }

  return {
    username: userDoc.name,
    facilityIds,
    roles: userDoc.roles || [],
  };
}
