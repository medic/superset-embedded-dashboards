import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health'];
const SECRET = new TextEncoder().encode(process.env.COOKIE_SECRET);

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/login')) {
    const token = request.cookies.get('AuthToken')?.value;
    if (token && await verifyToken(token)) {
      return NextResponse.redirect(new URL('/dashboards', request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/_next') || pathname.match(/\.(png|jpg|jpeg|svg|gif|ico|webp)$/)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('AuthToken')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (await verifyToken(token)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
