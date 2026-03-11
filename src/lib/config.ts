export interface DashboardConfig {
  id: string;
  name: string;
}

export interface AppConfig {
  chtDomain: string;
  supersetUrl: string;
  supersetUsername: string;
  supersetPassword: string;
  cookieSecret: string;
  dashboards: DashboardConfig[];
}

const REQUIRED_VARS = [
  'CHT_DOMAIN',
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

/**
 * Reads and validates all required environment variables, returning a typed application config.
 *
 * @returns The validated application configuration.
 * @throws Error if any required variable is missing or DASHBOARDS is not valid JSON.
 *
 * @example
 * ```typescript
 * // With all env vars set:
 * const config = getConfig();
 * console.log(config.chtDomain); // e.g. "https://cht.example.com"
 * console.log(config.dashboards); // e.g. [{ id: "abc", name: "My Dashboard" }]
 * ```
 */
export function getConfig(): AppConfig {
  for (const name of REQUIRED_VARS) {
    requireEnv(name);
  }

  let dashboards: DashboardConfig[];
  try {
    dashboards = JSON.parse(requireEnv('DASHBOARDS'));
    if (!Array.isArray(dashboards)) throw new Error();
  } catch {
    throw new Error('DASHBOARDS must be a valid JSON array');
  }

  return {
    chtDomain: requireEnv('CHT_DOMAIN'),
    supersetUrl: requireEnv('SUPERSET_URL'),
    supersetUsername: requireEnv('SUPERSET_USERNAME'),
    supersetPassword: requireEnv('SUPERSET_PASSWORD'),
    cookieSecret: requireEnv('COOKIE_SECRET'),
    dashboards,
  };
}
