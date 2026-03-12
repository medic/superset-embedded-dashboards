# Sentry Server-Side Integration Design

## Summary

Add server-only Sentry error tracking to the embedded dashboards app using `@sentry/nextjs`. Captures unhandled exceptions automatically and manually captures errors in key flows (auth, token generation, dashboard fetching).

## Decisions

- **Server-only**: No client SDK. The embedded Superset iframe has its own error handling, and most meaningful errors are server-side.
- **Optional DSN**: `SENTRY_DSN` env var is optional. If not set, Sentry is disabled and the app works normally.
- **Manual captures on key flows**: Auth failures, token generation errors, and middleware JWT failures are manually sent to Sentry since they're caught by try/catch blocks.
- **No extras**: No performance tracing, source maps upload, session replay, or client instrumentation.

## Approach

Use `@sentry/nextjs` with only the server config (`sentry.server.config.ts`). Skip `sentry.client.config.ts` entirely to avoid client bundle impact. Wrap `next.config.js` with `withSentryConfig()`.

## Files to create

- `sentry.server.config.ts` — Sentry server init (DSN, environment, sample rate)

## Files to modify

- `next.config.js` — wrap with `withSentryConfig()`
- `src/lib/config.ts` — add optional `SENTRY_DSN`
- `src/app/api/auth/login/route.ts` — capture auth failures
- `src/app/api/superset/token/route.ts` — capture token generation errors
- `src/app/api/dashboards/route.ts` — capture dashboard fetch errors
- `src/middleware.ts` — capture middleware auth errors
- `.env.example` — document `SENTRY_DSN`
- `k8s/deployment.yaml` — add `SENTRY_DSN` from secrets

## Auto-captured by Sentry

- Unhandled exceptions in API routes and server components
- Unhandled promise rejections
- Request context (URL, method, headers)

## Manually captured

- Auth failures (bad credentials, missing cookies, no facilities)
- Superset guest token generation failures
- Dashboard config/fetch errors
- Middleware JWT verification failures
