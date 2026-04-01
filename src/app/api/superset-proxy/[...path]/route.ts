import { NextRequest, NextResponse } from 'next/server';

const SUPERSET_URL = process.env.SUPERSET_URL;

/**
 * Reverse-proxy for Superset embedded pages.
 *
 * Superset sets `X-Frame-Options: sameorigin`, which blocks the browser from
 * loading it inside an iframe served from a different origin. Routing the
 * iframe request through this proxy makes it appear same-origin to the browser,
 * so the header restriction never fires.
 *
 * Only the entry-point HTML page (`/embedded/{uuid}`) needs proxying. All
 * subsequent asset and API requests made by Superset's JavaScript use absolute
 * URLs and go directly to the Superset server.
 *
 * @param request - The incoming request.
 * @param params.path - Path segments after `/api/superset-proxy/`.
 * @returns The proxied Superset response with `x-frame-options` removed.
 *
 * @example
 * ```
 * // GET /api/superset-proxy/embedded/abc-uuid
 * // → proxied from https://superset.example.com/embedded/abc-uuid
 * // → x-frame-options header is stripped from the response
 * ```
 */
async function proxyRequest(request: NextRequest, path: string[]): Promise<NextResponse> {
  if (!SUPERSET_URL) {
    return NextResponse.json({ error: 'SUPERSET_URL is not configured' }, { status: 500 });
  }

  const targetPath = path.join('/');
  const targetUrl = `${SUPERSET_URL}/${targetPath}${request.nextUrl.search}`;

  const upstreamHeaders = new Headers();
  for (const name of ['accept', 'accept-language', 'cookie', 'authorization', 'content-type']) {
    const value = request.headers.get(name);
    if (value) upstreamHeaders.set(name, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers: upstreamHeaders,
    redirect: 'follow',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    // @ts-expect-error — duplex required for streaming request bodies
    init.duplex = 'half';
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (err) {
    console.error('[superset-proxy] Upstream fetch failed', { targetUrl, err });
    return NextResponse.json({ error: 'Failed to reach Superset' }, { status: 502 });
  }

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('x-frame-options');
  responseHeaders.delete('content-security-policy');
  // Node's fetch() auto-decompresses the body, so these headers no longer
  // match the actual payload and cause ERR_CONTENT_DECODING_FAILED.
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyRequest(request, path);
}
