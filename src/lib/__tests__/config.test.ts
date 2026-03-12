import { getConfig, clearConfigCache, getCounties } from '../config';

describe('getConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    clearConfigCache();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('parses all required environment variables', () => {
    process.env.SUPERSET_URL = 'https://superset.test.com';
    process.env.SUPERSET_USERNAME = 'admin';
    process.env.SUPERSET_PASSWORD = 'secret';
    process.env.COOKIE_SECRET = 'a-secret-key-at-least-32-chars!!';
    process.env.DASHBOARDS = '[{"id":"d1","name":"Dashboard 1"}]';

    const config = getConfig();
    expect(config.supersetUrl).toBe('https://superset.test.com');
    expect(config.supersetUsername).toBe('admin');
    expect(config.supersetPassword).toBe('secret');
    expect(config.cookieSecret).toBe('a-secret-key-at-least-32-chars!!');
    expect(config.dashboards).toEqual([{ id: 'd1', name: 'Dashboard 1' }]);
    expect(config).not.toHaveProperty('chtDomain');
  });

  it('throws if required env var is missing', () => {
    delete process.env.SUPERSET_URL;
    expect(() => getConfig()).toThrow('Missing required environment variable: SUPERSET_URL');
  });

  it('throws if DASHBOARDS is invalid JSON', () => {
    process.env.SUPERSET_URL = 'https://superset.test.com';
    process.env.SUPERSET_USERNAME = 'admin';
    process.env.SUPERSET_PASSWORD = 'secret';
    process.env.COOKIE_SECRET = 'a-secret-key-at-least-32-chars!!';
    process.env.DASHBOARDS = 'not-json';

    expect(() => getConfig()).toThrow('DASHBOARDS must be a valid JSON array');
  });

  it('throws if COOKIE_SECRET is too short', () => {
    process.env.SUPERSET_URL = 'https://superset.test.com';
    process.env.SUPERSET_USERNAME = 'admin';
    process.env.SUPERSET_PASSWORD = 'secret';
    process.env.COOKIE_SECRET = 'too-short';
    process.env.DASHBOARDS = '[{"id":"d1","name":"Dashboard 1"}]';

    expect(() => getConfig()).toThrow('COOKIE_SECRET must be at least 32 characters');
  });
});

describe('getCounties', () => {
  it('returns the county list from counties.json', () => {
    const counties = getCounties();
    expect(Array.isArray(counties)).toBe(true);
    expect(counties.length).toBe(47);
    expect(counties[0]).toHaveProperty('name');
    expect(counties[0]).toHaveProperty('domain');
  });

  it('counties are alphabetically sorted', () => {
    const counties = getCounties();
    const names = counties.map((c) => c.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it('validates a known county domain exists', () => {
    const counties = getCounties();
    const nairobi = counties.find((c) => c.domain === 'nairobi.echis.go.ke');
    expect(nairobi).toBeDefined();
    expect(nairobi!.name).toBe('Nairobi');
  });
});
