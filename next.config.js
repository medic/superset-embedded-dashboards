/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      '@opentelemetry/instrumentation',
      'require-in-the-middle',
      '@sentry/node',
    ],
  },
};

module.exports = nextConfig;
