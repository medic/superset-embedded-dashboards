import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from login
  if (pathname.startsWith('/login')) {
    const token = request.cookies.get('AuthToken')?.value;
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.COOKIE_SECRET);
        await jwtVerify(token, secret, { algorithms: ['HS256'] });
        return NextResponse.redirect(new URL('/dashboards', request.url));
      } catch {
        // Invalid token — fall through to show login page
      }
    }
    return NextResponse.next();
  }

  // Allow other public routes
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp)$/)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('AuthToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.COOKIE_SECRET);
    await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
