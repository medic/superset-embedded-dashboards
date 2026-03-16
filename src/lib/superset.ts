import axios from 'axios';

const FACILITY_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Builds a SQL row-level security (RLS) clause that restricts query results
 * to rows matching the given facility IDs. Validates each ID against an
 * allowlist pattern to prevent SQL injection.
 *
 * @param facilityIds - Array of facility ID strings (alphanumeric, hyphens, underscores only).
 * @returns A SQL `IN` clause string, e.g. `"chu_code IN ('fac-001', 'fac-002')"`.
 * @throws Error if the array is empty or any ID contains disallowed characters.
 *
 * @example
 * ```typescript
 * const clause = buildRlsClause(['fac-001', 'fac-002']);
 * // => "chu_code IN ('fac-001', 'fac-002')"
 * ```
 */
export function buildRlsClause(facilityIds: string[]): string {
  if (facilityIds.length === 0) {
    throw new Error('At least one facility_id required');
  }
  for (const id of facilityIds) {
    if (!FACILITY_ID_PATTERN.test(id)) {
      throw new Error(`Invalid facility_id format: ${id}`);
    }
  }
  const quoted = facilityIds.map((id) => `'${id}'`).join(', ');
  return `chu_code IN (${quoted})`;
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
 *   facilityIds: ['fac-001'],
 *   username: 'cha_jane',
 * };
 * ```
 */
export interface GuestTokenParams {
  supersetUrl: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  facilityIds: string[];
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
    console.log('[superset] Using cached auth');
    const { accessToken, csrfToken, csrfCookie } = cachedAuth;
    return { accessToken, csrfToken, csrfCookie };
  }

  const loginEndpoint = `${supersetUrl}/api/v1/security/login`;
  console.log('[superset] Requesting access token', { endpoint: loginEndpoint, username });
  let accessToken: string;
  try {
    const loginResp = await axios.post(loginEndpoint, {
      username,
      password,
      provider: 'db',
      refresh: true,
    });
    accessToken = loginResp.data.access_token;
    console.log('[superset] Access token obtained successfully');
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const data = axios.isAxiosError(err) ? err.response?.data : undefined;
    console.error('[superset] Failed to obtain access token', { endpoint: loginEndpoint, status, data: JSON.stringify(data) });
    throw err;
  }

  const csrfEndpoint = `${supersetUrl}/api/v1/security/csrf_token/`;
  console.log('[superset] Requesting CSRF token', { endpoint: csrfEndpoint });
  let csrfToken: string;
  let csrfCookie: string;
  try {
    const csrfResp = await axios.get(csrfEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    csrfToken = csrfResp.data.result;
    csrfCookie = csrfResp.headers['set-cookie']?.join('; ') ?? '';
    console.log('[superset] CSRF token obtained successfully');
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
 *   facilityIds: ['fac-001'],
 *   username: 'cha_jane',
 * });
 * // token is a JWT string for the Superset Embedded SDK
 * ```
 */
export async function generateGuestToken(params: GuestTokenParams): Promise<string> {
  const { supersetUrl, supersetUsername, supersetPassword, dashboardId, facilityIds, username } = params;

  const { accessToken, csrfToken, csrfCookie } = await getSupersetAuth(supersetUrl, supersetUsername, supersetPassword);

  const guestEndpoint = `${supersetUrl}/api/v1/security/guest_token/`;
  const payload = {
    user: { username, first_name: username, last_name: '' },
    resources: [{ type: 'dashboard', id: dashboardId }],
    rls: [{ clause: buildRlsClause(facilityIds) }],
  };
  console.log('[superset] Requesting guest token', { endpoint: guestEndpoint, dashboardId, username, facilityIds });

  try {
    const guestResp = await axios.post(guestEndpoint, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-CSRFToken': csrfToken,
        Cookie: csrfCookie,
      },
    });
    console.log('[superset] Guest token obtained successfully');
    return guestResp.data.token;
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const data = axios.isAxiosError(err) ? err.response?.data : undefined;
    console.error('[superset] Failed to obtain guest token', { endpoint: guestEndpoint, dashboardId, status, data: JSON.stringify(data) });
    throw err;
  }
}
