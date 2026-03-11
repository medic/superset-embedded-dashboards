import jwt from 'jsonwebtoken';

/**
 * Payload stored inside a session JWT.
 *
 * @example
 * ```typescript
 * const payload: SessionPayload = {
 *   username: 'cha_user',
 *   facilityIds: ['facility-001'],
 * };
 * ```
 */
export interface SessionPayload {
  username: string;
  facilityIds: string[];
}

/**
 * Creates a signed JWT containing the given session payload.
 *
 * @param payload - The session data to encode.
 * @param secret - The signing secret (should be at least 32 characters).
 * @param expiresIn - Token lifetime as a zeit/ms string (default `'24h'`).
 * @returns A signed JWT string.
 *
 * @example
 * ```typescript
 * const token = createSessionToken(
 *   { username: 'cha_user', facilityIds: ['f1'] },
 *   'my-secret-key-at-least-32-chars!!',
 * );
 * // token is a dot-separated JWT string
 * ```
 */
export function createSessionToken(payload: SessionPayload, secret: string, expiresIn: string = '24h'): string {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies a JWT and extracts the session payload.
 *
 * @param token - The JWT string to verify.
 * @param secret - The secret that was used to sign the token.
 * @returns The decoded session payload.
 * @throws Error if the token is invalid, expired, or signed with a different secret.
 *
 * @example
 * ```typescript
 * const decoded = verifySessionToken(token, 'my-secret-key-at-least-32-chars!!');
 * console.log(decoded.username);    // 'cha_user'
 * console.log(decoded.facilityIds); // ['f1']
 * ```
 */
export function verifySessionToken(token: string, secret: string): SessionPayload {
  const decoded = jwt.verify(token, secret) as SessionPayload;
  return { username: decoded.username, facilityIds: decoded.facilityIds };
}
