import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  let currentUser = null;
  let response = NextResponse.next(); // Default response

  // Clone the request to modify its headers
  const requestHeaders = new Headers(request.headers);

  // Read the JWT token from the cookie
  const token = request.cookies.get('jwt_token')?.value;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUser = decoded;

      // Attach user info to the *request headers* for API routes
      requestHeaders.set('x-user-id', currentUser.id);
      requestHeaders.set('x-user-role', currentUser.role);
      if (currentUser.pilotId) {
        requestHeaders.set('x-user-pilot-id', currentUser.pilotId);
      }

      // Create a new request with modified headers
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (e) {
      console.error("JWT verification failed in middleware:", e);
      // If token is invalid or expired, clear the cookie and redirect to login
      response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('jwt_token');
      return response;
    }
  }

  // Define protected routes and their required roles for page access
  const protectedRoutes = {
    '/dashboard': ['Administrator', 'Pilot', 'Viewer'],
    '/flights': ['Administrator', 'Pilot', 'Viewer'],
    '/drones': ['Administrator', 'Pilot', 'Viewer'],
    '/pilots': ['Administrator', 'Pilot', 'Viewer'],
    '/schedule': ['Administrator'],
    '/compliance': ['Administrator', 'Viewer'],
    '/flights/new': ['Administrator', 'Pilot'],
  };

  // Check if the current path is a protected route (for pages)
  for (const route in protectedRoutes) {
    if (pathname.startsWith(route)) {
      if (!currentUser) {
        // Redirect unauthenticated users to login page
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const requiredRoles = protectedRoutes[route];
      if (!requiredRoles.includes(currentUser.role)) {
        // Redirect unauthorized users to an access denied page
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
    }
  }

  // For API routes, the `withAuth` middleware will handle authorization based on the headers set above.
  // For public pages, simply allow access.
  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/flights/:path*',
    '/drones/:path*',
    '/pilots/:path*',
    '/schedule/:path*',
    '/compliance/:path*',
    '/api/:path*', // Protect all API routes as well
  ],
};
