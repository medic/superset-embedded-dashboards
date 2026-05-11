// src/__tests__/integration/auth-flow.test.ts
import jwt from 'jsonwebtoken';
import { createSessionToken, verifySessionToken } from '@/lib/session';
import { buildRlsClause } from '@/lib/superset';

describe('Auth → Token flow (unit integration)', () => {
  const secret = 'integration-test-secret-32-chars!!';

  it('full pipeline: auth → JWT → RLS clause', async () => {
    const user = {
      username: 'cha_test',
      facilityId: 'facility-100',
      roles: ['chw'],
    };

    const token = createSessionToken(
      { username: user.username, facilityId: user.facilityId, county: 'nairobi.echis.go.ke' },
      secret
    );

    const session = verifySessionToken(token, secret);
    expect(session.username).toBe('cha_test');
    expect(session.facilityId).toBe('facility-100');
    expect(session.county).toBe('nairobi.echis.go.ke');

    const rls = buildRlsClause(session.facilityId);
    expect(rls).toBe("chu_uuid = 'facility-100'");
  });

  it('rejects tampered facility ID in RLS', () => {
    expect(() => buildRlsClause("'; DROP TABLE users--")).toThrow('Invalid facility_id format');
  });

  it('JWT tokens use HS256 algorithm (required for jose middleware compatibility)', () => {
    const token = createSessionToken(
      { username: 'cha_test', facilityId: 'fac-1', county: 'test.echis.go.ke' },
      secret
    );
    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
  });

  it('rejects expired session before RLS generation', () => {
    const token = createSessionToken(
      { username: 'cha_test', facilityId: 'fac-1', county: 'test.echis.go.ke' },
      secret,
      '0s'
    );
    expect(() => verifySessionToken(token, secret)).toThrow();
  });
});
