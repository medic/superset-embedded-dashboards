import { NextResponse } from 'next/server';

/**
 * Logs the user out by clearing the AuthToken session cookie.
 *
 * Sets the `AuthToken` cookie to an empty value with `maxAge: 0`, effectively
 * deleting it from the browser.
 *
 * @returns JSON `{ ok: true }` confirming the logout.
 *
 * @example
 * ```typescript
 * // POST /api/auth/logout
 * // Response 200: { "ok": true }
 * // Clears cookie: AuthToken
 * ```
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('AuthToken', '', { maxAge: 0, path: '/' });
  return response;
}
