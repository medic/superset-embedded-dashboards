import { NextRequest, NextResponse } from 'next/server';
import { authenticateCht } from '@/lib/cht-auth';
import { createSessionToken } from '@/lib/session';
import { getConfig } from '@/lib/config';

/**
 * Handles user login by authenticating against CHT and issuing a session cookie.
 *
 * Expects a JSON body with `username` and `password`. On success, sets an `AuthToken`
 * httpOnly cookie containing a signed JWT and returns the authenticated username.
 *
 * @param request - The incoming request with JSON body `{ username, password }`.
 * @returns JSON `{ username }` on success, or `{ error }` with appropriate status code.
 *
 * @example
 * ```typescript
 * // POST /api/auth/login
 * // Body: { "username": "cha_jane", "password": "s3cret" }
 * // Response 200: { "username": "cha_jane" }
 * // Sets cookie: AuthToken=<jwt>
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const config = getConfig();
    const user = await authenticateCht(config.chtDomain, username, password);
    const token = createSessionToken(
      { username: user.username, facilityIds: user.facilityIds },
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
    return NextResponse.json({ error: message }, { status });
  }
}
