import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const loginUrl = new URL('/login', request.url);
  const isApiPath = request.nextUrl.pathname.startsWith('/api/');

  if (!token) {
    if (isApiPath) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(loginUrl);
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error('JWT_SECRET is not defined');
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error: JWT secret missing' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Standard verify is synchronous and throws on error
    verify(token, jwtSecret);
    // Token is valid, allow request to proceed
    return NextResponse.next();
  } catch (error: any) {
    console.error('JWT Verification Error:', error.message);
    if (isApiPath) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/goals/:path*', '/api/progress/:path*'],
};