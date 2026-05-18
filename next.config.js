/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    '@sentry/node',
  ],
};

module.exports = nextConfig;
