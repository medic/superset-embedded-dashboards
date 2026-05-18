/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: [
    '@opentelemetry/instrumentation',
    'require-in-the-middle',
    '@sentry/node',
  ],
};

module.exports = nextConfig;
