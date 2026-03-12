const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableClientWebpackPlugin: true,
  disableServerWebpackPlugin: true,
  autoInstrumentServerFunctions: false,
});
