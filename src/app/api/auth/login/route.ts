import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateCht } from '@/lib/cht-auth';
import { createSessionToken } from '@/lib/session';
import { getConfig, getCounties } from '@/lib/config';

/**
 * Handles user login by authenticating against the selected county's CHT instance.
 *
 * Expects a JSON body with `county` (domain string), `username`, and `password`.
 * Validates the county against counties.json, authenticates against that county's
 * CouchDB, then sets an `AuthToken` httpOnly cookie containing a signed JWT.
 *
 * @param request - The incoming request with JSON body `{ county, username, password }`.
 * @returns JSON `{ username }` on success, or `{ error }` with appropriate status code.
 *
 * @example
 * ```typescript
 * // POST /api/auth/login
 * // Body: { "county": "nairobi.echis.go.ke", "username": "cha_jane", "password": "s3cret" }
 * // Response 200: { "username": "cha_jane" }
 * // Sets cookie: AuthToken=<jwt>
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const { county, username, password } = await request.json();
    if (!county || !username || !password) {
      return NextResponse.json({ error: 'County, username, and password are required' }, { status: 400 });
    }

    const counties = getCounties();
    const validCounty = counties.find((c) => c.domain === county);
    if (!validCounty) {
      return NextResponse.json({ error: 'Invalid county selected' }, { status: 400 });
    }

    const chtDomain = `https://${validCounty.domain}`;
    const config = getConfig();
    const user = await authenticateCht(chtDomain, username, password);
    const token = createSessionToken(
      { username: user.username, facilityId: user.facilityId, county: validCounty.domain },
      config.cookieSecret
    );

    const response = NextResponse.json({ username: user.username });
    response.cookies.set('AuthToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    const status = message.includes('Invalid username') ? 401 : 500;
    if (status === 500) Sentry.captureException(err);
    return NextResponse.json({ error: message }, { status });
  }
}
