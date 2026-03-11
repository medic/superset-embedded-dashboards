import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Kubernetes liveness and readiness probes.
 *
 * Returns a JSON response with `{ status: 'ok' }` and HTTP 200 when the
 * application is running and able to handle requests.
 *
 * @example
 * // GET /api/health
 * // Response: { "status": "ok" }
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
