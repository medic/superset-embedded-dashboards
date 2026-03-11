// src/__tests__/integration/auth-flow.test.ts
import jwt from 'jsonwebtoken';
import { createSessionToken, verifySessionToken } from '@/lib/session';
import { buildRlsClause } from '@/lib/superset';

describe('Auth → Token flow (unit integration)', () => {
  const secret = 'integration-test-secret-32-chars!!';

  it('full pipeline: auth → JWT → RLS clause', async () => {
    const user = {
      username: 'cha_test',
      facilityIds: ['facility-100', 'facility-200'],
      roles: ['chw'],
    };

    const token = createSessionToken(
      { username: user.username, facilityIds: user.facilityIds },
      secret
    );

    const session = verifySessionToken(token, secret);
    expect(session.username).toBe('cha_test');
    expect(session.facilityIds).toEqual(['facility-100', 'facility-200']);

    const rls = buildRlsClause(session.facilityIds);
    expect(rls).toBe("facility_id IN ('facility-100', 'facility-200')");
  });

  it('rejects tampered facility IDs in RLS', () => {
    expect(() => buildRlsClause(["'; DROP TABLE users--"])).toThrow('Invalid facility_id format');
  });

  it('JWT tokens use HS256 algorithm (required for jose middleware compatibility)', () => {
    const token = createSessionToken(
      { username: 'cha_test', facilityIds: ['fac-1'] },
      secret
    );
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
  });

  it('rejects expired session before RLS generation', () => {
    const token = createSessionToken(
      { username: 'cha_test', facilityIds: ['fac-1'] },
      secret,
      '0s'
    );
    expect(() => verifySessionToken(token, secret)).toThrow();
  });
});
