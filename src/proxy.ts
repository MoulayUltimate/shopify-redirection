import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a sample proxy demonstrating edge redirection logic.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Example: Redirect old product URLs to a new structure
  if (pathname.startsWith('/products/old-collection')) {
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = pathname.replace('/products/old-collection', '/collections/new-arrivals');
    return NextResponse.redirect(newUrl);
  }

  // Example: Redirect traffic from a specific country
  // const country = request.geo?.country || 'US';
  // if (pathname === '/region-exclusive' && country !== 'CA') {
  //   const newUrl = request.nextUrl.clone();
  //   newUrl.pathname = '/not-available';
  //   return NextResponse.rewrite(newUrl); // rewrite or redirect
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico, sitemap.xml, robots.txt (metadata files)
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
