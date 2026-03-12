import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { verifySessionToken } from '@/lib/session';
import { getConfig } from '@/lib/config';

/**
 * Returns the list of configured dashboards for authenticated users.
 *
 * Requires a valid `AuthToken` cookie. Verifies the session and returns
 * the full dashboard list from the application configuration.
 *
 * @param request - The incoming request (must include the `AuthToken` cookie).
 * @returns JSON `{ dashboards }` array on success, or `{ error }` with 401 status.
 *
 * @example
 * ```typescript
 * // GET /api/dashboards
 * // Cookie: AuthToken=<valid-jwt>
 * // Response 200: { "dashboards": [{ "id": "dash-1", "name": "Overview" }] }
 * ```
 */
export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('AuthToken')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const config = getConfig();
    verifySessionToken(authToken, config.cookieSecret);
    return NextResponse.json({ dashboards: config.dashboards });
  } catch (err: unknown) {
    Sentry.captureException(err, { tags: { route: 'dashboards' } });
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
