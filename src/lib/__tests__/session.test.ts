import { createSessionToken, verifySessionToken, SessionPayload } from '../session';

describe('session tokens', () => {
  const secret = 'test-secret-key-at-least-32-chars!!';
  const payload: SessionPayload = {
    username: 'cha_user',
    facilityIds: ['facility-001', 'facility-002'],
  };

  it('creates and verifies a valid token', () => {
    const token = createSessionToken(payload, secret);
    const decoded = verifySessionToken(token, secret);
    expect(decoded.username).toBe('cha_user');
    expect(decoded.facilityIds).toEqual(['facility-001', 'facility-002']);
  });

  it('throws on invalid token', () => {
    expect(() => verifySessionToken('garbage', secret)).toThrow();
  });

  it('throws on expired token', () => {
    const token = createSessionToken(payload, secret, '0s');
    expect(() => verifySessionToken(token, secret)).toThrow('jwt expired');
  });

  it('throws on wrong secret', () => {
    const token = createSessionToken(payload, secret);
    expect(() => verifySessionToken(token, 'wrong-secret-key-32-chars-long!!')).toThrow();
  });
});
