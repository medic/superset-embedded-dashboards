import { NextRequest, NextResponse } from 'next/server';

const rawDSN = process.env.SENTRY_DSN;
if (!rawDSN) throw new Error('SENTRY_DSN environment variable is required');
const DSN: string = rawDSN;

/**
 * Proxies error reports to GlitchTip, bypassing ad blockers that block third-party
 * tracking domains. Only forwards to the project's own GlitchTip DSN endpoint.
 *
 * @param request - The incoming envelope request from the Sentry SDK client.
 * @returns 200 on success, 500 on forwarding failure.
 *
 * @example
 * ```typescript
 * // Configured in sentry.client.config.ts via: tunnel: "/api/glitchtip-tunnel"
 * // POST /api/glitchtip-tunnel
 * // Body: <sentry envelope payload>
 * // Response 200: { "status": "ok" }
 * ```
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const dsn = new URL(DSN);
  const projectId = dsn.pathname.replace('/', '');
  const url = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/`;

  const body = await request.text();

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
  });

  await upstream.text();

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Failed to forward to GlitchTip' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok' });
}
