// src/lib/authMiddleware.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

/**
 * A higher-order function to protect API routes with JWT authentication and RBAC.
 *
 * @param {function} handler - The original API route handler (e.g., GET, POST, PUT, DELETE).
 * @param {Array<string>} allowedRoles - An array of roles that are allowed to access this route.
 * @returns {function} An async function that acts as a middleware wrapper.
 */
export const withAuth = (handler, allowedRoles = []) => {
  return async (request, context) => {
    // The middleware.js already handles JWT verification and attaches user info
    // to the request headers. We can retrieve it from there.
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userPilotId = request.headers.get('x-user-pilot-id');

    if (!userId || !userRole) {
      // This case should ideally be caught by middleware.js redirecting to login,
      // but as a fallback for API routes, return unauthorized.
      return new NextResponse('Authentication required', { status: 401 });
    }

    // Reconstruct user object for the handler
    request.user = {
      id: userId,
      role: userRole,
      pilotId: userPilotId || null,
    };

    // Check RBAC
    if (allowedRoles.length > 0 && !allowedRoles.includes(request.user.role)) {
      return new NextResponse('Forbidden: You do not have the necessary permissions', { status: 403 });
    }

    return handler(request, context);
  };
};
