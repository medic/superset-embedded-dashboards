import axios from 'axios';

const FACILITY_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Builds a SQL row-level security (RLS) clause that restricts query results
 * to rows matching the given facility IDs. Validates each ID against an
 * allowlist pattern to prevent SQL injection.
 *
 * @param facilityIds - Array of facility ID strings (alphanumeric, hyphens, underscores only).
 * @returns A SQL `IN` clause string, e.g. `"facility_id IN ('fac-001', 'fac-002')"`.
 * @throws Error if the array is empty or any ID contains disallowed characters.
 *
 * @example
 * ```typescript
 * const clause = buildRlsClause(['fac-001', 'fac-002']);
 * // => "facility_id IN ('fac-001', 'fac-002')"
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
  return `facility_id IN (${quoted})`;
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
let cachedAccessToken: { token: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 4 * 60 * 1000; // 4 minutes (Superset tokens last ~5 min)

async function getSupersetAccessToken(supersetUrl: string, username: string, password: string): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token;
  }

  const loginResp = await axios.post(`${supersetUrl}/api/v1/security/login`, {
    username,
    password,
    provider: 'db',
    refresh: true,
  });

  cachedAccessToken = {
    token: loginResp.data.access_token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return cachedAccessToken.token;
}

export async function generateGuestToken(params: GuestTokenParams): Promise<string> {
  const { supersetUrl, supersetUsername, supersetPassword, dashboardId, facilityIds, username } = params;

  const accessToken = await getSupersetAccessToken(supersetUrl, supersetUsername, supersetPassword);

  const guestResp = await axios.post(
    `${supersetUrl}/api/v1/security/guest_token/`,
    {
      user: { username, first_name: username, last_name: '' },
      resources: [{ type: 'dashboard', id: dashboardId }],
      rls: [{ clause: buildRlsClause(facilityIds) }],
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return guestResp.data.token;
}
