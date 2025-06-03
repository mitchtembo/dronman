// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import { successResponse, errorResponse, handleApiError } from '@/lib/apiResponse';

export async function POST(request) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== 'string') {
      return errorResponse('Firebase ID token is required and must be a string.', 400);
    }

    // Verify the Firebase ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user data from Firestore
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let user;

    if (!userDoc.exists) {
      // If user doesn't exist in Firestore, create a basic entry
      // and automatically create a linked pilot profile if the role is 'Pilot'.
      const defaultRole = 'Pilot'; // Default role for new sign-ups

      let pilotId = null;
      let pilotName = null;

      // Automatically create a pilot profile if the default role is Pilot
      if (defaultRole === 'Pilot') {
        // Derive a basic name from the email
        pilotName = decodedToken.email ? decodedToken.email.split('@')[0].replace('.', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'New Pilot';

        const newPilotData = {
          userId: uid,
          name: pilotName,
          email: decodedToken.email,
          contact: null,
          status: 'Active',
          certifications: [],
        };
        const pilotDocRef = await db.collection('pilots').add(newPilotData);
        pilotId = pilotDocRef.id;
      }

      user = {
        uid: uid,
        email: decodedToken.email,
        role: defaultRole,
        pilotId: pilotId, // Link to the newly created pilot profile
      };
      await userRef.set(user);
    } else {
      user = userDoc.data();
    }

    // Return user information
    return successResponse({
      user: {
        uid: user.uid,
        email: user.email,
        role: user.role,
        pilotId: user.pilotId,
      },
    });
  } catch (error) {
    // Handle Firebase authentication errors
    if (error.code === 'auth/id-token-expired') {
      return errorResponse('Authentication token expired. Please log in again.', 401);
    }
    if (error.code === 'auth/invalid-id-token') {
      return errorResponse('Invalid authentication token.', 401);
    }
    return handleApiError(error);
  }
}
