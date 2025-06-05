import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Authorization token missing or invalid.', 401);
    }

    const idToken = authHeader.split(' ')[1];

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
      return errorResponse('Invalid or expired ID token.', 401);
    }

    const uid = decodedToken.uid;

    // Fetch user data from Firestore
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return errorResponse('User not found in Firestore.', 404);
    }

    const user = userDoc.data();

    return successResponse({
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        pilotId: user.pilotId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
