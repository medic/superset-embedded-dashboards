import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { generateGuestToken } from '@/lib/superset';
import { getConfig } from '@/lib/config';

/**
 * Generates a Superset guest token for embedding a specific dashboard.
 *
 * Requires a valid `AuthToken` cookie and a JSON body with `dashboardId`.
 * Validates the dashboard ID against the configured allowlist, then requests
 * a guest token from Superset scoped to the user's facility IDs.
 *
 * @param request - The incoming request with cookie and JSON body `{ dashboardId }`.
 * @returns JSON `{ token }` containing the Superset guest JWT, or `{ error }` on failure.
 *
 * @example
 * ```typescript
 * // POST /api/superset/token
 * // Cookie: AuthToken=<valid-jwt>
 * // Body: { "dashboardId": "dash-uuid-1" }
 * // Response 200: { "token": "<superset-guest-jwt>" }
 * ```
 */
export async function POST(request: NextRequest) {
  const authToken = request.cookies.get('AuthToken')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const config = getConfig();
  let session;
  try {
    session = verifySessionToken(authToken, config.cookieSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const { dashboardId } = await request.json();
    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId is required' }, { status: 400 });
    }

    const validDashboard = config.dashboards.find((d) => d.id === dashboardId);
    if (!validDashboard) {
      return NextResponse.json({ error: 'Unknown dashboard' }, { status: 400 });
    }

    const guestToken = await generateGuestToken({
      supersetUrl: config.supersetUrl,
      supersetUsername: config.supersetUsername,
      supersetPassword: config.supersetPassword,
      dashboardId,
      facilityId: session.facilityId,
      username: session.username,
    });

    return NextResponse.json({ token: guestToken });
  } catch (err: unknown) {
    Sentry.captureException(err);
    return NextResponse.json({ error: 'Failed to generate dashboard token' }, { status: 500 });
  }
}
