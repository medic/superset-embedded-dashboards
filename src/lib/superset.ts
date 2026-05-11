import axios from 'axios';

const FACILITY_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Builds a SQL row-level security (RLS) clause that restricts query results
 * to rows matching the given facility ID. Validates the ID against an
 * allowlist pattern to prevent SQL injection.
 *
 * @param facilityId - A facility ID string (alphanumeric, hyphens, underscores only).
 * @returns A SQL equality clause string, e.g. `"chu_uuid = 'fac-001'"`.
 * @throws Error if the string is empty or contains disallowed characters.
 *
 * @example
 * ```typescript
 * const clause = buildRlsClause('fac-001');
 * // => "chu_uuid = 'fac-001'"
 * ```
 */
export function buildRlsClause(facilityId: string): string {
  if (!facilityId) {
    throw new Error('facility_id is required');
  }
  if (!FACILITY_ID_PATTERN.test(facilityId)) {
    throw new Error(`Invalid facility_id format: ${facilityId}`);
  }
  return `chu_uuid = '${facilityId}'`;
}

/**
 * Parameters required to generate a Superset guest token.
 *
 * @example
 * ```typescript
 * const params: GuestTokenParams = {
 *   supersetUrl: 'https://superset.example.com',
 *   supersetUsername: 'admin',
 *   supersetPassword: 'secret',
 *   dashboardId: 'dash-uuid-1',
 *   facilityId: 'fac-001',
 *   username: 'cha_jane',
 * };
 * ```
 */
export interface GuestTokenParams {
  supersetUrl: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  facilityId: string;
  username: string;
}

let cachedAuth: { accessToken: string; csrfToken: string; csrfCookie: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 4 * 60 * 1000; // 4 minutes (Superset tokens last ~5 min)

/** Resets the auth cache. Exported for use in tests only. */
export function resetAuthCache(): void {
  cachedAuth = null;
}

async function getSupersetAuth(
  supersetUrl: string,
  username: string,
  password: string
): Promise<{ accessToken: string; csrfToken: string; csrfCookie: string }> {
  if (cachedAuth && Date.now() < cachedAuth.expiresAt) {
    const { accessToken, csrfToken, csrfCookie } = cachedAuth;
    return { accessToken, csrfToken, csrfCookie };
  }

  const loginEndpoint = `${supersetUrl}/api/v1/security/login`;
  let accessToken: string;
  try {
    const loginResp = await axios.post(loginEndpoint, {
      username,
      password,
      provider: 'db',
      refresh: true,
    });
    accessToken = loginResp.data.access_token;
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const data = axios.isAxiosError(err) ? err.response?.data : undefined;
    console.error('[superset] Failed to obtain access token', { endpoint: loginEndpoint, status, data: JSON.stringify(data) });
    throw err;
  }

  const csrfEndpoint = `${supersetUrl}/api/v1/security/csrf_token/`;
  let csrfToken: string;
  let csrfCookie: string;
  try {
    const csrfResp = await axios.get(csrfEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    csrfToken = csrfResp.data.result;
    csrfCookie = csrfResp.headers['set-cookie']?.join('; ') ?? '';
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const data = axios.isAxiosError(err) ? err.response?.data : undefined;
    console.error('[superset] Failed to obtain CSRF token', { endpoint: csrfEndpoint, status, data: JSON.stringify(data) });
    throw err;
  }

  cachedAuth = { accessToken, csrfToken, csrfCookie, expiresAt: Date.now() + TOKEN_TTL_MS };
  return { accessToken, csrfToken, csrfCookie };
}

/**
 * Authenticates against a Superset instance using the admin credentials, then
 * requests a guest token scoped to a specific dashboard with row-level security
 * filtering by the user's facility IDs.
 *
 * @param params - The guest token request parameters.
 * @returns The guest JWT token string for embedding.
 * @throws Error if Superset authentication or token generation fails.
 *
 * @example
 * ```typescript
 * const token = await generateGuestToken({
 *   supersetUrl: 'https://superset.example.com',
 *   supersetUsername: 'admin',
 *   supersetPassword: 'secret',
 *   dashboardId: 'dash-uuid-1',
 *   facilityId: 'fac-001',
 *   username: 'cha_jane',
 * });
 * // token is a JWT string for the Superset Embedded SDK
 * ```
 */
export async function generateGuestToken(params: GuestTokenParams): Promise<string> {
  const { supersetUrl, supersetUsername, supersetPassword, dashboardId, facilityId, username } = params;

  const { accessToken, csrfToken, csrfCookie } = await getSupersetAuth(supersetUrl, supersetUsername, supersetPassword);

  const guestEndpoint = `${supersetUrl}/api/v1/security/guest_token/`;
  const payload = {
    user: { username, first_name: username, last_name: '' },
    resources: [{ type: 'dashboard', id: dashboardId }],
    rls: [{ clause: buildRlsClause(facilityId) }],
  };
  try {
    const guestResp = await axios.post(guestEndpoint, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-CSRFToken': csrfToken,
        Cookie: csrfCookie,
      },
    });
    return guestResp.data.token;
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const data = axios.isAxiosError(err) ? err.response?.data : undefined;
    console.error('[superset] Failed to obtain guest token', { endpoint: guestEndpoint, dashboardId, status, data: JSON.stringify(data) });
    throw err;
  }
}
