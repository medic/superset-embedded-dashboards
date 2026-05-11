import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { getConfig } from '@/lib/config';

/**
 * Returns the current user's session payload if a valid AuthToken cookie is present.
 *
 * Verifies the JWT from the `AuthToken` cookie and returns the decoded session
 * containing `username` and `facilityId`.
 *
 * @param request - The incoming request (must include the `AuthToken` cookie).
 * @returns JSON `{ username, facilityId }` on success, or `{ error }` with 401 status.
 *
 * @example
 * ```typescript
 * // GET /api/auth/session
 * // Cookie: AuthToken=<valid-jwt>
 * // Response 200: { "username": "cha_jane", "facilityId": ["fac-001"] }
 * ```
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get('AuthToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const config = getConfig();
    const session = verifySessionToken(token, config.cookieSecret);
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
