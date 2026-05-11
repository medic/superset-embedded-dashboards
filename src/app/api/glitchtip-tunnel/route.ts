import { NextRequest, NextResponse } from 'next/server';

const DSN= process.env.SENTRY_DSN as string;

/**
 * Proxies error reports to GlitchTip, bypassing ad blockers that block third-party
 * tracking domains. Only forwards to the project's own GlitchTip DSN endpoint.
 *
 * @param request - The incoming envelope request from the Sentry SDK client.
 * @returns 200 on success, 500 on forwarding failure.
 *
 * @example
 * ```typescript
 * // Configured in sentry.client.config.js via: tunnel: "/api/glitchtip-tunnel"
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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to forward to GlitchTip' }, { status: 500 });
  }

  return NextResponse.json({ status: 'ok' });
}
