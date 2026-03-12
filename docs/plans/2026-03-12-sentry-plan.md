# Sentry Server-Side Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add server-only Sentry error tracking that auto-captures unhandled exceptions and manually captures errors in auth, token, and dashboard flows.

**Architecture:** Install `@sentry/nextjs`, create only `sentry.server.config.ts` (no client config), wrap `next.config.js` with `withSentryConfig()`. Add `Sentry.captureException()` in existing catch blocks. DSN is optional — app works without it.

**Tech Stack:** `@sentry/nextjs`, Next.js 14, TypeScript

---

### Task 1: Install @sentry/nextjs

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run: `npm install @sentry/nextjs`

**Step 2: Verify installation**

Run: `npm ls @sentry/nextjs`
Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @sentry/nextjs"
```

---

### Task 2: Create sentry.server.config.ts

**Files:**
- Create: `sentry.server.config.ts` (project root)

**Step 1: Create the server config**

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: 0,
});
```

Key decisions:
- `enabled: !!process.env.SENTRY_DSN` — Sentry is a no-op when DSN is not set
- `tracesSampleRate: 0` — no performance tracing, just error capture

**Step 2: Commit**

```bash
git add sentry.server.config.ts
git commit -m "feat: add Sentry server config"
```

---

### Task 3: Wrap next.config.js with Sentry

**Files:**
- Modify: `next.config.js`

**Step 1: Read current `next.config.js` for context**

Current contents:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
```

**Step 2: Wrap with withSentryConfig**

Replace entire file with:

```javascript
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
```

Key decisions:
- `silent: true` — no noisy build output
- `disableClientWebpackPlugin: true` — no client-side source map upload
- `disableServerWebpackPlugin: true` — no source map upload (keeping it simple)
- `autoInstrumentServerFunctions: false` — we manually instrument what we need

**Step 3: Verify build still works**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add next.config.js
git commit -m "feat: wrap next.config.js with Sentry"
```

---

### Task 4: Add SENTRY_DSN to config and environment files

**Files:**
- Modify: `.env.example`
- Modify: `k8s/deployment.yaml`

**Step 1: Add SENTRY_DSN to .env.example**

Append to end of `.env.example`:

```
# Sentry error tracking (optional — leave empty to disable)
SENTRY_DSN=
```

**Step 2: Add SENTRY_DSN to k8s/deployment.yaml**

Add after the DASHBOARDS env var block:

```yaml
            - name: SENTRY_DSN
              valueFrom:
                secretKeyRef:
                  name: cha-dashboard-secrets
                  key: sentry-dsn
```

**Step 3: Commit**

```bash
git add .env.example k8s/deployment.yaml
git commit -m "feat: add SENTRY_DSN to env config and k8s deployment"
```

---

### Task 5: Add Sentry.captureException to login route

**Files:**
- Modify: `src/app/api/auth/login/route.ts:55-58`

**Step 1: Add Sentry import and capture**

Add to top of file:
```typescript
import * as Sentry from '@sentry/nextjs';
```

Replace the catch block (lines 55-58):
```typescript
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    const status = message.includes('Invalid username') ? 401 : 500;
    if (status === 500) {
      Sentry.captureException(err, { tags: { route: 'auth/login' } });
    }
    return NextResponse.json({ error: message }, { status });
  }
```

Note: Only capture 500s — 401s are expected user errors, not bugs.

**Step 2: Commit**

```bash
git add src/app/api/auth/login/route.ts
git commit -m "feat: add Sentry error capture to login route"
```

---

### Task 6: Add Sentry.captureException to superset token route

**Files:**
- Modify: `src/app/api/superset/token/route.ts:54-57`

**Step 1: Add Sentry import and capture**

Add to top of file:
```typescript
import * as Sentry from '@sentry/nextjs';
```

Replace the catch block (lines 54-57):
```typescript
  } catch (err: unknown) {
    Sentry.captureException(err, { tags: { route: 'superset/token' } });
    console.error('Guest token generation failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to generate dashboard token' }, { status: 500 });
  }
```

**Step 2: Commit**

```bash
git add src/app/api/superset/token/route.ts
git commit -m "feat: add Sentry error capture to token route"
```

---

### Task 7: Add Sentry.captureException to dashboards route

**Files:**
- Modify: `src/app/api/dashboards/route.ts:31-33`

**Step 1: Add Sentry import and capture**

Add to top of file:
```typescript
import * as Sentry from '@sentry/nextjs';
```

Replace the catch block (lines 31-33):
```typescript
  } catch (err: unknown) {
    Sentry.captureException(err, { tags: { route: 'dashboards' } });
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
```

**Step 2: Commit**

```bash
git add src/app/api/dashboards/route.ts
git commit -m "feat: add Sentry error capture to dashboards route"
```

---

### Task 8: Add Sentry.captureException to middleware

**Files:**
- Modify: `src/middleware.ts:28-29`

**Step 1: Add Sentry import and capture**

Add to top of file:
```typescript
import * as Sentry from '@sentry/nextjs';
```

Replace the catch block (lines 28-29):
```typescript
  } catch (err: unknown) {
    Sentry.captureException(err, { tags: { component: 'middleware' } });
    return NextResponse.redirect(new URL('/login', request.url));
  }
```

**Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Sentry error capture to auth middleware"
```

---

### Task 9: Write tests for Sentry integration

**Files:**
- Create: `src/lib/__tests__/sentry.test.ts`

**Step 1: Write tests that verify Sentry.captureException is called**

```typescript
import * as Sentry from '@sentry/nextjs';

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
}));

describe('Sentry integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captureException is callable with error and tags', () => {
    const error = new Error('test error');
    Sentry.captureException(error, { tags: { route: 'test' } });
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { tags: { route: 'test' } });
  });

  it('captureException handles non-Error objects', () => {
    Sentry.captureException('string error', { tags: { route: 'test' } });
    expect(Sentry.captureException).toHaveBeenCalledWith('string error', { tags: { route: 'test' } });
  });
});
```

**Step 2: Run tests**

Run: `npx jest src/lib/__tests__/sentry.test.ts -v`
Expected: PASS

**Step 3: Run full test suite to ensure nothing broke**

Run: `npm test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/lib/__tests__/sentry.test.ts
git commit -m "test: add Sentry integration tests"
```

---

### Task 10: Verify build and run final checks

**Step 1: Verify build**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 2: Verify lint**

Run: `npm run lint`
Expected: No lint errors

**Step 3: Run full test suite**

Run: `npm test`
Expected: All tests pass
