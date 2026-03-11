import { getConfig, clearConfigCache } from '../config';

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
    process.env.CHT_DOMAIN = 'https://cht.test.com';
    process.env.SUPERSET_URL = 'https://superset.test.com';
    process.env.SUPERSET_USERNAME = 'admin';
    process.env.SUPERSET_PASSWORD = 'secret';
    process.env.COOKIE_SECRET = 'a-secret-key-at-least-32-chars!!';
    process.env.DASHBOARDS = '[{"id":"d1","name":"Dashboard 1"}]';

    const config = getConfig();
    expect(config.chtDomain).toBe('https://cht.test.com');
    expect(config.supersetUrl).toBe('https://superset.test.com');
    expect(config.supersetUsername).toBe('admin');
    expect(config.supersetPassword).toBe('secret');
    expect(config.cookieSecret).toBe('a-secret-key-at-least-32-chars!!');
    expect(config.dashboards).toEqual([{ id: 'd1', name: 'Dashboard 1' }]);
  });

  it('throws if required env var is missing', () => {
    delete process.env.CHT_DOMAIN;
    expect(() => getConfig()).toThrow('Missing required environment variable: CHT_DOMAIN');
  });

  it('throws if DASHBOARDS is invalid JSON', () => {
    process.env.CHT_DOMAIN = 'https://cht.test.com';
    process.env.SUPERSET_URL = 'https://superset.test.com';
    process.env.SUPERSET_USERNAME = 'admin';
    process.env.SUPERSET_PASSWORD = 'secret';
    process.env.COOKIE_SECRET = 'a-secret-key-at-least-32-chars!!';
    process.env.DASHBOARDS = 'not-json';

    expect(() => getConfig()).toThrow('DASHBOARDS must be a valid JSON array');
  });

  it('throws if COOKIE_SECRET is too short', () => {
    process.env.CHT_DOMAIN = 'https://cht.test.com';
    process.env.SUPERSET_URL = 'https://superset.test.com';
    process.env.SUPERSET_USERNAME = 'admin';
    process.env.SUPERSET_PASSWORD = 'secret';
    process.env.COOKIE_SECRET = 'too-short';
    process.env.DASHBOARDS = '[{"id":"d1","name":"Dashboard 1"}]';

    expect(() => getConfig()).toThrow('COOKIE_SECRET must be at least 32 characters');
  });
});
