# CHA Dashboard Access Portal — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Next.js app that authenticates CHAs via CHT/CouchDB and renders Superset dashboards filtered by `facility_id`.

**Architecture:** Next.js 14 App Router with API routes. Auth mirrors [cht-user-management](https://github.com/medic/cht-user-management): POST CouchDB `_session`, fetch user doc for `facility_id`, encode as JWT cookie. Backend generates Superset guest tokens with RLS clauses. Frontend uses `@superset-ui/embedded-sdk` to render filtered dashboards in an iframe.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, jsonwebtoken, axios, @superset-ui/embedded-sdk, Node 20 LTS, Docker/K8s.

**Reference:** `PRD.md` in repo root. Auth patterns from `/Users/kombo/Medic/Code/cht-user-management/src/lib/cht-session.ts`.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `.env.example`, `.env.local` (gitignored)
- Create: `.eslintrc.json`
- Modify: `.gitignore`

**Step 1: Initialize Next.js project**

```bash
cd /Users/kombo/Medic/Code/superset-embedded-dashboards
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

If the directory is non-empty, the tool may refuse. In that case, init in a temp dir and move files:

```bash
npx create-next-app@14 temp-init --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
cp -rf temp-init/* temp-init/.* . 2>/dev/null; rm -rf temp-init
```

**Step 2: Install dependencies**

```bash
npm install jsonwebtoken axios @superset-ui/embedded-sdk
npm install -D @types/jsonwebtoken
```

**Step 3: Create `.env.example`**

```env
# CHT instance (single domain)
CHT_DOMAIN=https://cht.example.com

# Superset service account
SUPERSET_URL=https://superset.example.com
SUPERSET_USERNAME=embed-service-account
SUPERSET_PASSWORD=changeme

# Session signing
COOKIE_SECRET=changeme-32-chars-minimum-random

# Dashboard config (JSON array)
DASHBOARDS=[{"id":"dashboard-uuid-1","name":"CHU Performance"},{"id":"dashboard-uuid-2","name":"Monthly Summary"}]
```

**Step 4: Update `.gitignore`**

Append:

```
.env.local
.env
```

**Step 5: Verify scaffold works**

Run: `npm run dev`
Expected: Next.js dev server starts on http://localhost:3000

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with dependencies"
```

---

## Task 2: Environment Config Module

**Files:**
- Create: `src/lib/config.ts`
- Create: `src/lib/__tests__/config.test.ts`

**Step 1: Write the failing test**

```typescript
// src/lib/__tests__/config.test.ts
import { getConfig } from '../config';

describe('getConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
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
});
```

**Step 2: Install Jest and run test to verify it fails**

```bash
npm install -D jest ts-jest @types/jest
npx ts-jest config:init
```

Run: `npx jest src/lib/__tests__/config.test.ts --verbose`
Expected: FAIL — `Cannot find module '../config'`

**Step 3: Write minimal implementation**

```typescript
// src/lib/config.ts
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

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

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
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/config.test.ts --verbose`
Expected: 3 tests PASS

**Step 5: Commit**

```bash
git add src/lib/config.ts src/lib/__tests__/config.test.ts jest.config.js
git commit -m "feat: add environment config module with validation"
```

---

## Task 3: CHT Authentication Library

**Files:**
- Create: `src/lib/cht-auth.ts`
- Create: `src/lib/__tests__/cht-auth.test.ts`

This module authenticates against CouchDB `_session` and fetches the user's `facility_id` from their user doc. Pattern is from `cht-user-management/src/lib/cht-session.ts`.

**Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/cht-auth.test.ts
import axios from 'axios';
import { authenticateCht, ChtUser } from '../cht-auth';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('authenticateCht', () => {
  const chtDomain = 'https://cht.test.com';

  afterEach(() => jest.resetAllMocks());

  it('returns user with facility_ids on successful auth', async () => {
    // Mock _session POST
    mockedAxios.post.mockResolvedValueOnce({
      headers: { 'set-cookie': ['AuthSession=abc123; Path=/; HttpOnly'] },
    });
    // Mock user doc GET
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        name: 'cha_user',
        roles: ['chw'],
        facility_id: ['facility-001', 'facility-002'],
      },
    });

    const user = await authenticateCht(chtDomain, 'cha_user', 'password123');

    expect(user).toEqual({
      username: 'cha_user',
      facilityIds: ['facility-001', 'facility-002'],
      roles: ['chw'],
    });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://cht.test.com/_session',
      { name: 'cha_user', password: 'password123' },
      { auth: { username: 'cha_user', password: 'password123' } }
    );
  });

  it('handles facility_id as a single string', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      headers: { 'set-cookie': ['AuthSession=abc123; Path=/'] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { name: 'cha_user', roles: ['chw'], facility_id: 'facility-001' },
    });

    const user = await authenticateCht(chtDomain, 'cha_user', 'pass');
    expect(user.facilityIds).toEqual(['facility-001']);
  });

  it('throws on invalid credentials (401)', async () => {
    mockedAxios.post.mockRejectedValueOnce({ response: { status: 401 } });

    await expect(authenticateCht(chtDomain, 'bad', 'creds'))
      .rejects.toThrow('Invalid username or password');
  });

  it('throws if user has no facility_id', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      headers: { 'set-cookie': ['AuthSession=abc123; Path=/'] },
    });
    mockedAxios.get.mockResolvedValueOnce({
      data: { name: 'cha_user', roles: ['chw'], facility_id: [] },
    });

    await expect(authenticateCht(chtDomain, 'cha_user', 'pass'))
      .rejects.toThrow('No facilities assigned');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/lib/__tests__/cht-auth.test.ts --verbose`
Expected: FAIL — `Cannot find module '../cht-auth'`

**Step 3: Write minimal implementation**

```typescript
// src/lib/cht-auth.ts
import axios from 'axios';

export interface ChtUser {
  username: string;
  facilityIds: string[];
  roles: string[];
}

export async function authenticateCht(
  chtDomain: string,
  username: string,
  password: string
): Promise<ChtUser> {
  // Step 1: Authenticate via CouchDB _session
  let sessionCookie: string;
  try {
    const resp = await axios.post(
      `${chtDomain}/_session`,
      { name: username, password },
      { auth: { username, password } }
    );
    const setCookie = resp.headers['set-cookie'];
    const authCookie = setCookie
      ?.find((c: string) => c.startsWith('AuthSession='));
    if (!authCookie) {
      throw new Error('No auth cookie received');
    }
    sessionCookie = authCookie.split(';')[0];
  } catch (err: any) {
    if (err?.response?.status === 401) {
      throw new Error('Invalid username or password');
    }
    throw err;
  }

  // Step 2: Fetch user doc to get facility_id
  const userDocUrl = `${chtDomain}/medic/org.couchdb.user:${username}`;
  const { data: userDoc } = await axios.get(userDocUrl, {
    headers: { Cookie: sessionCookie },
  });

  const facilityIds = [userDoc.facility_id].flat().filter(Boolean);
  if (facilityIds.length === 0) {
    throw new Error('No facilities assigned to this user');
  }

  return {
    username: userDoc.name,
    facilityIds,
    roles: userDoc.roles || [],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/cht-auth.test.ts --verbose`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/lib/cht-auth.ts src/lib/__tests__/cht-auth.test.ts
git commit -m "feat: add CHT/CouchDB authentication library"
```

---

## Task 4: JWT Session Management

**Files:**
- Create: `src/lib/session.ts`
- Create: `src/lib/__tests__/session.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/session.test.ts
import { createSessionToken, verifySessionToken, SessionPayload } from '../session';

describe('session tokens', () => {
  const secret = 'test-secret-key-at-least-32-chars!!';
  const payload: SessionPayload = {
    username: 'cha_user',
    facilityIds: ['facility-001', 'facility-002'],
  };

  it('creates and verifies a valid token', () => {
    const token = createSessionToken(payload, secret);
    const decoded = verifySessionToken(token, secret);
    expect(decoded.username).toBe('cha_user');
    expect(decoded.facilityIds).toEqual(['facility-001', 'facility-002']);
  });

  it('throws on invalid token', () => {
    expect(() => verifySessionToken('garbage', secret)).toThrow();
  });

  it('throws on expired token', () => {
    const token = createSessionToken(payload, secret, '0s');
    expect(() => verifySessionToken(token, secret)).toThrow('jwt expired');
  });

  it('throws on wrong secret', () => {
    const token = createSessionToken(payload, secret);
    expect(() => verifySessionToken(token, 'wrong-secret-key-32-chars-long!!')).toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/lib/__tests__/session.test.ts --verbose`
Expected: FAIL — `Cannot find module '../session'`

**Step 3: Write minimal implementation**

```typescript
// src/lib/session.ts
import jwt from 'jsonwebtoken';

export interface SessionPayload {
  username: string;
  facilityIds: string[];
}

export function createSessionToken(
  payload: SessionPayload,
  secret: string,
  expiresIn: string = '24h'
): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifySessionToken(token: string, secret: string): SessionPayload {
  const decoded = jwt.verify(token, secret) as SessionPayload;
  return { username: decoded.username, facilityIds: decoded.facilityIds };
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/session.test.ts --verbose`
Expected: 4 tests PASS

**Step 5: Commit**

```bash
git add src/lib/session.ts src/lib/__tests__/session.test.ts
git commit -m "feat: add JWT session token creation and verification"
```

---

## Task 5: Superset Guest Token Generator

**Files:**
- Create: `src/lib/superset.ts`
- Create: `src/lib/__tests__/superset.test.ts`

**Step 1: Write the failing tests**

```typescript
// src/lib/__tests__/superset.test.ts
import axios from 'axios';
import { generateGuestToken, buildRlsClause } from '../superset';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('buildRlsClause', () => {
  it('builds IN clause from facility IDs', () => {
    const clause = buildRlsClause(['fac-001', 'fac-002']);
    expect(clause).toBe("facility_id IN ('fac-001', 'fac-002')");
  });

  it('handles single facility ID', () => {
    const clause = buildRlsClause(['fac-001']);
    expect(clause).toBe("facility_id IN ('fac-001')");
  });

  it('rejects facility IDs with SQL injection characters', () => {
    expect(() => buildRlsClause(["fac'; DROP TABLE--"]))
      .toThrow('Invalid facility_id format');
  });

  it('rejects empty array', () => {
    expect(() => buildRlsClause([])).toThrow('At least one facility_id required');
  });
});

describe('generateGuestToken', () => {
  const supersetUrl = 'https://superset.test.com';

  afterEach(() => jest.resetAllMocks());

  it('authenticates to Superset and generates guest token', async () => {
    // Mock login
    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'superset-access-token' },
    });
    // Mock guest token
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'guest-jwt-token-123' },
    });

    const token = await generateGuestToken({
      supersetUrl,
      supersetUsername: 'admin',
      supersetPassword: 'secret',
      dashboardId: 'dash-uuid-1',
      facilityIds: ['fac-001'],
      username: 'cha_user',
    });

    expect(token).toBe('guest-jwt-token-123');
    // Verify login call
    expect(mockedAxios.post).toHaveBeenNthCalledWith(1,
      'https://superset.test.com/api/v1/security/login',
      { username: 'admin', password: 'secret', provider: 'db', refresh: true }
    );
    // Verify guest token call
    expect(mockedAxios.post).toHaveBeenNthCalledWith(2,
      'https://superset.test.com/api/v1/security/guest_token/',
      {
        user: { username: 'cha_user', first_name: 'cha_user', last_name: '' },
        resources: [{ type: 'dashboard', id: 'dash-uuid-1' }],
        rls: [{ clause: "facility_id IN ('fac-001')" }],
      },
      { headers: { Authorization: 'Bearer superset-access-token' } }
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest src/lib/__tests__/superset.test.ts --verbose`
Expected: FAIL — `Cannot find module '../superset'`

**Step 3: Write minimal implementation**

```typescript
// src/lib/superset.ts
import axios from 'axios';

const FACILITY_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function buildRlsClause(facilityIds: string[]): string {
  if (facilityIds.length === 0) {
    throw new Error('At least one facility_id required');
  }
  for (const id of facilityIds) {
    if (!FACILITY_ID_PATTERN.test(id)) {
      throw new Error(`Invalid facility_id format: ${id}`);
    }
  }
  const quoted = facilityIds.map((id) => `'${id}'`).join(', ');
  return `facility_id IN (${quoted})`;
}

interface GuestTokenParams {
  supersetUrl: string;
  supersetUsername: string;
  supersetPassword: string;
  dashboardId: string;
  facilityIds: string[];
  username: string;
}

export async function generateGuestToken(params: GuestTokenParams): Promise<string> {
  const { supersetUrl, supersetUsername, supersetPassword, dashboardId, facilityIds, username } = params;

  // Step 1: Login to Superset to get access token
  const loginResp = await axios.post(`${supersetUrl}/api/v1/security/login`, {
    username: supersetUsername,
    password: supersetPassword,
    provider: 'db',
    refresh: true,
  });
  const accessToken = loginResp.data.access_token;

  // Step 2: Generate guest token with RLS
  const guestResp = await axios.post(
    `${supersetUrl}/api/v1/security/guest_token/`,
    {
      user: { username, first_name: username, last_name: '' },
      resources: [{ type: 'dashboard', id: dashboardId }],
      rls: [{ clause: buildRlsClause(facilityIds) }],
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return guestResp.data.token;
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest src/lib/__tests__/superset.test.ts --verbose`
Expected: 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/superset.ts src/lib/__tests__/superset.test.ts
git commit -m "feat: add Superset guest token generation with RLS"
```

---

## Task 6: Auth API Routes

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/session/route.ts`
- Create: `src/app/api/auth/logout/route.ts`

No unit tests for these thin route handlers — they'll be covered by E2E tests (Task 11). Each route is <20 lines of plumbing.

**Step 1: Create POST /api/auth/login**

```typescript
// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateCht } from '@/lib/cht-auth';
import { createSessionToken } from '@/lib/session';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const config = getConfig();
    const user = await authenticateCht(config.chtDomain, username, password);
    const token = createSessionToken(
      { username: user.username, facilityIds: user.facilityIds },
      config.cookieSecret
    );

    const response = NextResponse.json({ username: user.username });
    response.cookies.set('AuthToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (err: any) {
    const message = err.message || 'Authentication failed';
    const status = message.includes('Invalid username') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
```

**Step 2: Create GET /api/auth/session**

```typescript
// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { getConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('AuthToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const config = getConfig();
    const session = verifySessionToken(token, config.cookieSecret);
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
```

**Step 3: Create POST /api/auth/logout**

```typescript
// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('AuthToken', '', { maxAge: 0, path: '/' });
  return response;
}
```

**Step 4: Verify routes compile**

Run: `npm run build`
Expected: Build succeeds (may have warnings about unused pages, that's fine)

**Step 5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add auth API routes (login, session, logout)"
```

---

## Task 7: Superset Token API Route

**Files:**
- Create: `src/app/api/superset/token/route.ts`

**Step 1: Create POST /api/superset/token**

```typescript
// src/app/api/superset/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { generateGuestToken } from '@/lib/superset';
import { getConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  const authToken = request.cookies.get('AuthToken')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const config = getConfig();
    const session = verifySessionToken(authToken, config.cookieSecret);

    const { dashboardId } = await request.json();
    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId is required' }, { status: 400 });
    }

    // Validate dashboard ID is in our config
    const validDashboard = config.dashboards.find((d) => d.id === dashboardId);
    if (!validDashboard) {
      return NextResponse.json({ error: 'Unknown dashboard' }, { status: 400 });
    }

    const guestToken = await generateGuestToken({
      supersetUrl: config.supersetUrl,
      supersetUsername: config.supersetUsername,
      supersetPassword: config.supersetPassword,
      dashboardId,
      facilityIds: session.facilityIds,
      username: session.username,
    });

    return NextResponse.json({ token: guestToken });
  } catch (err: any) {
    console.error('Guest token generation failed:', err.message);
    return NextResponse.json({ error: 'Failed to generate dashboard token' }, { status: 500 });
  }
}
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/api/superset/token/route.ts
git commit -m "feat: add Superset guest token API route"
```

---

## Task 8: Dashboards API Route

**Files:**
- Create: `src/app/api/dashboards/route.ts`

**Step 1: Create GET /api/dashboards**

```typescript
// src/app/api/dashboards/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/session';
import { getConfig } from '@/lib/config';

export async function GET(request: NextRequest) {
  const authToken = request.cookies.get('AuthToken')?.value;
  if (!authToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const config = getConfig();
    verifySessionToken(authToken, config.cookieSecret);
    return NextResponse.json({ dashboards: config.dashboards });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/dashboards/route.ts
git commit -m "feat: add dashboards list API route"
```

---

## Task 9: Login Page

**Files:**
- Create: `src/app/login/page.tsx`
- Modify: `src/app/page.tsx` (redirect to /dashboards or /login)
- Create: `src/app/layout.tsx` (update if needed)

**Step 1: Create login page**

```tsx
// src/app/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboards');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-semibold text-center mb-6">Dashboard Portal</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Update root page to redirect**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboards');
}
```

**Step 3: Verify it renders**

Run: `npm run dev`
Navigate to: `http://localhost:3000/login`
Expected: Login form renders with username/password fields

**Step 4: Commit**

```bash
git add src/app/login/page.tsx src/app/page.tsx
git commit -m "feat: add login page and root redirect"
```

---

## Task 10: Auth Middleware (Route Protection)

**Files:**
- Create: `src/middleware.ts`

**Step 1: Create middleware**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('AuthToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.COOKIE_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Note:** Middleware runs in the Edge runtime, so we use `jose` instead of `jsonwebtoken` (which uses Node.js crypto). Install it:

```bash
npm install jose
```

**Step 2: Verify protected routes redirect to login**

Run: `npm run dev`
Navigate to: `http://localhost:3000/dashboards`
Expected: Redirects to `/login`

**Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware to protect routes"
```

---

## Task 11: Dashboard List & Embed Pages

**Files:**
- Create: `src/app/dashboards/page.tsx`
- Create: `src/app/dashboards/[id]/page.tsx`
- Create: `src/components/SupersetEmbed.tsx`

**Step 1: Create the Superset embed component**

```tsx
// src/components/SupersetEmbed.tsx
'use client';

import { useEffect, useRef } from 'react';
import { embedDashboard } from '@superset-ui/embedded-sdk';

interface SupersetEmbedProps {
  dashboardId: string;
  supersetDomain: string;
}

export default function SupersetEmbed({ dashboardId, supersetDomain }: SupersetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const fetchGuestToken = async (): Promise<string> => {
      const res = await fetch('/api/superset/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardId }),
      });
      if (!res.ok) throw new Error('Failed to fetch guest token');
      const data = await res.json();
      return data.token;
    };

    embedDashboard({
      id: dashboardId,
      supersetDomain,
      mountPoint: containerRef.current,
      fetchGuestToken,
      dashboardUiConfig: {
        hideTitle: false,
        hideTab: false,
        hideChartControls: false,
        filters: { visible: true, expanded: false },
      },
    });
  }, [dashboardId, supersetDomain]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading dashboard...
      </div>
    </div>
  );
}
```

**Step 2: Create dashboard list page**

```tsx
// src/app/dashboards/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Dashboard {
  id: string;
  name: string;
}

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboards')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setDashboards(data.dashboards))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Dashboard Portal</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-medium mb-4">Available Dashboards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <Link
              key={d.id}
              href={`/dashboards/${d.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-blue-600">{d.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Click to view</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Step 3: Create dashboard embed page**

```tsx
// src/app/dashboards/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SupersetEmbed from '@/components/SupersetEmbed';

interface Dashboard {
  id: string;
  name: string;
}

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [supersetDomain, setSupersetDomain] = useState('');

  useEffect(() => {
    fetch('/api/dashboards')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setDashboards(data.dashboards))
      .catch(() => router.push('/login'));

    // Get superset domain from a simple config endpoint
    setSupersetDomain(window.location.origin); // Will be overridden
  }, [router]);

  const currentDashboard = dashboards.find((d) => d.id === dashboardId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r min-h-screen p-4">
        <Link href="/dashboards" className="text-lg font-semibold block mb-6">
          Dashboard Portal
        </Link>
        <nav className="space-y-1">
          {dashboards.map((d) => (
            <Link
              key={d.id}
              href={`/dashboards/${d.id}`}
              className={`block px-3 py-2 rounded text-sm ${
                d.id === dashboardId
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {d.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-medium">
            {currentDashboard?.name || 'Loading...'}
          </h1>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </header>
        <div className="p-0">
          {process.env.NEXT_PUBLIC_SUPERSET_URL ? (
            <SupersetEmbed
              dashboardId={dashboardId}
              supersetDomain={process.env.NEXT_PUBLIC_SUPERSET_URL}
            />
          ) : (
            <p className="p-6 text-red-500">NEXT_PUBLIC_SUPERSET_URL is not configured</p>
          )}
        </div>
      </main>
    </div>
  );
}
```

**Step 4: Add `NEXT_PUBLIC_SUPERSET_URL` to `.env.example`**

Append to `.env.example`:

```
# Public (exposed to browser) — Superset URL for iframe embedding
NEXT_PUBLIC_SUPERSET_URL=https://superset.example.com
```

**Step 5: Verify it compiles**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/app/dashboards/ src/components/SupersetEmbed.tsx .env.example
git commit -m "feat: add dashboard list page, embed page, and sidebar navigation"
```

---

## Task 12: Dockerfile & Kubernetes Manifests

**Files:**
- Create: `Dockerfile`
- Create: `k8s/deployment.yaml`
- Create: `k8s/service.yaml`
- Create: `.dockerignore`

**Step 1: Create `.dockerignore`**

```
node_modules
.next
.git
.env.local
.env
```

**Step 2: Create Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

**Step 3: Update `next.config.js` for standalone output**

Ensure `next.config.js` includes:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

module.exports = nextConfig;
```

**Step 4: Create K8s deployment**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cha-dashboard-portal
  labels:
    app: cha-dashboard-portal
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cha-dashboard-portal
  template:
    metadata:
      labels:
        app: cha-dashboard-portal
    spec:
      containers:
        - name: portal
          image: cha-dashboard-portal:latest
          ports:
            - containerPort: 3000
          env:
            - name: CHT_DOMAIN
              valueFrom:
                secretKeyRef:
                  name: cha-dashboard-secrets
                  key: cht-domain
            - name: SUPERSET_URL
              valueFrom:
                secretKeyRef:
                  name: cha-dashboard-secrets
                  key: superset-url
            - name: NEXT_PUBLIC_SUPERSET_URL
              valueFrom:
                configMapKeyRef:
                  name: cha-dashboard-config
                  key: superset-public-url
            - name: SUPERSET_USERNAME
              valueFrom:
                secretKeyRef:
                  name: cha-dashboard-secrets
                  key: superset-username
            - name: SUPERSET_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: cha-dashboard-secrets
                  key: superset-password
            - name: COOKIE_SECRET
              valueFrom:
                secretKeyRef:
                  name: cha-dashboard-secrets
                  key: cookie-secret
            - name: DASHBOARDS
              valueFrom:
                configMapKeyRef:
                  name: cha-dashboard-config
                  key: dashboards
          readinessProbe:
            httpGet:
              path: /api/auth/session
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/auth/session
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "500m"
```

**Step 5: Create K8s service**

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: cha-dashboard-portal
spec:
  selector:
    app: cha-dashboard-portal
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

**Step 6: Verify Docker build**

Run: `docker build -t cha-dashboard-portal .`
Expected: Build completes successfully

**Step 7: Commit**

```bash
git add Dockerfile .dockerignore k8s/ next.config.js
git commit -m "feat: add Dockerfile and Kubernetes deployment manifests"
```

---

## Task 13: Health Check Endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

**Step 1: Create health endpoint**

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
```

**Step 2: Update K8s probes to use /api/health instead of /api/auth/session**

In `k8s/deployment.yaml`, change both probe paths from `/api/auth/session` to `/api/health`.

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts k8s/deployment.yaml
git commit -m "feat: add health check endpoint, update K8s probes"
```

---

## Task 14: Integration Test — Full Auth + Token Flow

**Files:**
- Create: `src/__tests__/integration/auth-flow.test.ts`

This test verifies the critical path: login → session → guest token generation.

**Step 1: Write the integration test**

```typescript
// src/__tests__/integration/auth-flow.test.ts
import { authenticateCht } from '@/lib/cht-auth';
import { createSessionToken, verifySessionToken } from '@/lib/session';
import { buildRlsClause } from '@/lib/superset';

/**
 * Integration test: verifies the full auth-to-RLS pipeline works end-to-end
 * without hitting real external services (mocked at HTTP level).
 *
 * Example:
 *   npx jest src/__tests__/integration/auth-flow.test.ts --verbose
 */
describe('Auth → Token flow (unit integration)', () => {
  const secret = 'integration-test-secret-32-chars!!';

  it('full pipeline: auth → JWT → RLS clause', async () => {
    // Simulate what happens after authenticateCht returns
    const user = {
      username: 'cha_test',
      facilityIds: ['facility-100', 'facility-200'],
      roles: ['chw'],
    };

    // Create session token
    const token = createSessionToken(
      { username: user.username, facilityIds: user.facilityIds },
      secret
    );

    // Verify session token (as middleware would)
    const session = verifySessionToken(token, secret);
    expect(session.username).toBe('cha_test');
    expect(session.facilityIds).toEqual(['facility-100', 'facility-200']);

    // Build RLS clause (as guest token route would)
    const rls = buildRlsClause(session.facilityIds);
    expect(rls).toBe("facility_id IN ('facility-100', 'facility-200')");
  });

  it('rejects tampered facility IDs in RLS', () => {
    expect(() => buildRlsClause(["'; DROP TABLE users--"])).toThrow('Invalid facility_id format');
  });

  it('rejects expired session before RLS generation', () => {
    const token = createSessionToken(
      { username: 'cha_test', facilityIds: ['fac-1'] },
      secret,
      '0s'
    );
    expect(() => verifySessionToken(token, secret)).toThrow();
  });
});
```

**Step 2: Run the integration test**

Run: `npx jest src/__tests__/integration/auth-flow.test.ts --verbose`
Expected: 3 tests PASS

**Step 3: Commit**

```bash
git add src/__tests__/integration/auth-flow.test.ts
git commit -m "test: add integration test for auth-to-RLS pipeline"
```

---

## Task 15: Run All Tests & Final Verification

**Step 1: Run the full test suite**

```bash
npx jest --verbose --coverage
```

Expected: All tests pass. Coverage report shows lib modules well covered.

**Step 2: Run the build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors (warnings are acceptable).

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "chore: fix lint/build issues from final verification"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | Project scaffold | `package.json`, `next.config.js`, `.env.example` |
| 2 | Config module | `src/lib/config.ts` + tests |
| 3 | CHT auth library | `src/lib/cht-auth.ts` + tests |
| 4 | JWT sessions | `src/lib/session.ts` + tests |
| 5 | Superset tokens | `src/lib/superset.ts` + tests |
| 6 | Auth API routes | `src/app/api/auth/*/route.ts` |
| 7 | Token API route | `src/app/api/superset/token/route.ts` |
| 8 | Dashboards API | `src/app/api/dashboards/route.ts` |
| 9 | Login page | `src/app/login/page.tsx` |
| 10 | Auth middleware | `src/middleware.ts` |
| 11 | Dashboard pages | `src/app/dashboards/`, `src/components/SupersetEmbed.tsx` |
| 12 | Docker + K8s | `Dockerfile`, `k8s/` |
| 13 | Health check | `src/app/api/health/route.ts` |
| 14 | Integration test | `src/__tests__/integration/auth-flow.test.ts` |
| 15 | Final verification | Full test + build + lint |
