// src/lib/authMiddleware.js
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';

/**
 * A higher-order function to protect API routes with Firebase authentication and RBAC.
 *
 * @param {function} handler - The original API route handler (e.g., GET, POST, PUT, DELETE).
 * @param {Array<string>} allowedRoles - An array of roles that are allowed to access this route.
 * @returns {function} An async function that acts as a middleware wrapper.
 */
export const withAuth = (handler, allowedRoles = []) => {
  return async (request, context) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const userDoc = await db.collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return NextResponse.json({ error: 'Forbidden: User not found in database' }, { status: 403 });
      }

      // Attach user information to the request object
      request.user = {
        uid: uid,
        email: decodedToken.email,
        ...userDoc.data(), // Includes role and pilotId from Firestore
      };

      // Check RBAC
      if (allowedRoles.length > 0 && !allowedRoles.includes(request.user.role)) {
        return NextResponse.json({ error: 'Forbidden: You do not have the necessary permissions' }, { status: 403 });
      }

      return handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Authentication token expired. Please log in again.' }, { status: 401 });
      }
      if (error.code === 'auth/invalid-id-token') {
        return NextResponse.json({ error: 'Unauthorized: Invalid authentication token.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Unauthorized: Authentication failed.' }, { status: 401 });
    }
  };
};
