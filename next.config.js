/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    '@sentry/nextjs',
    '@sentry/node',
    '@sentry/core',
    '@sentry/opentelemetry',
  ],
};

module.exports = nextConfig;
