import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  let currentUser = null;
  let response = NextResponse.next(); // Default response

  // Clone the request to modify its headers
  const requestHeaders = new Headers(request.headers);

  // Read the Firebase ID token from the cookie (for browser-based authentication)
  let token = request.cookies.get('firebase_id_token')?.value;

  // If no token in cookie, check Authorization header (for API clients like Postman)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Extract token after "Bearer "
    }
  }

  if (token) {
    try {
      const decoded = await auth.verifyIdToken(token);
      currentUser = decoded;

      // Attach user info to the *request headers* for API routes
      // These headers are then read by withAuth middleware
      requestHeaders.set('x-user-id', currentUser.uid);
      requestHeaders.set('x-user-email', currentUser.email || '');
      if (currentUser.role) {
        requestHeaders.set('x-user-role', currentUser.role);
      }
      if (currentUser.pilotId) {
        requestHeaders.set('x-user-pilot-id', currentUser.pilotId);
      }

      // Create a new response with modified request headers
      // This ensures the modified headers are passed down the chain
      response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (e) {
      console.error("Firebase ID token verification failed in middleware:", e);
      // For API routes, return a 401. For page routes, redirect to login.
      if (pathname.startsWith('/api')) {
        return new NextResponse('Authentication required', { status: 401 });
      } else {
        response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('firebase_id_token');
        return response;
      }
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

      // Role-based access control (if you store role in custom claims or Firestore)
      // For now, allow all authenticated users. You can enhance this by fetching user role from Firestore if needed.
      // const requiredRoles = protectedRoutes[route];
      // if (!requiredRoles.includes(currentUser.role)) {
      //   return NextResponse.redirect(new URL('/access-denied', request.url));
      // }
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
