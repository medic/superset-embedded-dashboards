import countiesData from '../../counties.json';

/**
 * Represents a county with its CHT instance domain.
 */
export interface County {
  name: string;
  domain: string;
}

export interface DashboardConfig {
  id: string;
  name: string;
}

export interface AppConfig {
  supersetUrl: string;
  supersetUsername: string;
  supersetPassword: string;
  cookieSecret: string;
  dashboards: DashboardConfig[];
}

const REQUIRED_VARS = [
  'SUPERSET_URL',
  'SUPERSET_USERNAME',
  'SUPERSET_PASSWORD',
  'COOKIE_SECRET',
  'DASHBOARDS',
] as const;

/**
 * Retrieves a required environment variable or throws if it is missing.
 *
 * @param name - The environment variable name.
 * @returns The value of the environment variable.
 * @throws Error if the variable is not set.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let _cached: AppConfig | null = null;

/**
 * Reads and validates all required environment variables, returning a typed application config.
 *
 * @returns The validated application configuration.
 * @throws Error if any required variable is missing or DASHBOARDS is not valid JSON.
 *
 * @example
 * ```typescript
 * const config = getConfig();
 * console.log(config.supersetUrl); // e.g. "https://superset.example.com"
 * console.log(config.dashboards); // e.g. [{ id: "abc", name: "My Dashboard" }]
 * ```
 */
export function getConfig(): AppConfig {
  if (_cached) return _cached;

  for (const name of REQUIRED_VARS) {
    requireEnv(name);
  }

  const cookieSecret = requireEnv('COOKIE_SECRET');
  if (cookieSecret.length < 32) {
    throw new Error('COOKIE_SECRET must be at least 32 characters');
  }

  let dashboards: DashboardConfig[];
  try {
    dashboards = JSON.parse(requireEnv('DASHBOARDS'));
    if (!Array.isArray(dashboards)) throw new Error();
  } catch {
    throw new Error('DASHBOARDS must be a valid JSON array');
  }

  _cached = {
    supersetUrl: requireEnv('SUPERSET_URL'),
    supersetUsername: requireEnv('SUPERSET_USERNAME'),
    supersetPassword: requireEnv('SUPERSET_PASSWORD'),
    cookieSecret,
    dashboards,
  };
  return _cached;
}

/** Clears the cached config. Useful for testing. */
export function clearConfigCache(): void {
  _cached = null;
}

/**
 * Returns the list of counties from counties.json.
 * Used by the login API to validate county domains and by the login page for the dropdown.
 *
 * @returns Array of county objects with name and domain.
 *
 * @example
 * ```typescript
 * const counties = getCounties();
 * console.log(counties[0]); // { name: "Baringo", domain: "baringo.echis.go.ke" }
 * ```
 */
export function getCounties(): County[] {
  return countiesData as County[];
}
