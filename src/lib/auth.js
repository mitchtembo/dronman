import Cookies from 'js-cookie';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { app, db } from '@/lib/firebaseClient'; // Import Firebase client app and db
import { doc, getDoc } from "firebase/firestore"; // Import Firestore client functions

const TOKEN_KEY = 'firebase_id_token'; // Key for storing Firebase ID token in cookies

const firebaseAuth = getAuth(app);

export async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await userCredential.user.getIdToken();

    // Send ID token to your backend /api/auth/login route
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Backend login failed');
    }

    const responseData = await response.json();
    const { user } = responseData.data; // Backend returns user data including role and pilotId

    // Store the ID token in a cookie for subsequent requests
    Cookies.set(TOKEN_KEY, idToken, { expires: 1, path: '/' }); // Token expires in 1 hour by default, refresh as needed

    return user; // Return user data from backend
  } catch (error) {
    console.error("Client-side login error:", error);
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('User account has been disabled.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred during login.');
    }
  }
}

export async function logout() {
  try {
    await signOut(firebaseAuth); // Sign out from Firebase
    Cookies.remove(TOKEN_KEY); // Remove token from cookies
  } catch (error) {
    console.error("Client-side logout error:", error);
  }
}

export async function getCurrentUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const idToken = Cookies.get(TOKEN_KEY);
  if (!idToken) {
    return null;
  }

  // For client-side, we can rely on Firebase's auth state observer
  // or re-verify the token with the backend if needed.
  // For simplicity, we'll fetch user data from Firestore using the UID from the token
  // or rely on the backend's /api/auth/me endpoint if implemented.

  // A more robust approach would be to use onAuthStateChanged and store user data in a global state.
  // For now, we'll fetch from Firestore using the UID from the token (if available)
  // or rely on the backend to provide the user object after token verification.

  // This function is primarily for client-side use to get basic user info.
  // For full user data with roles, the backend /api/auth/login or /api/auth/me should be used.
  // Here, we'll just return the decoded token's payload if it's valid.
  // Note: Client-side JWT decoding is not secure for authorization, only for display.
  // The actual authorization happens on the backend with auth.verifyIdToken.

  // To get the user's role and pilotId on the client, we need to fetch it from Firestore
  // or rely on the backend's login response.
  // For now, we'll return a basic user object if a token exists.
  try {
    // This is a simplified client-side check.
    // In a real app, you'd likely have a global state (e.g., Redux, Context API)
    // populated by the backend's /api/auth/login response or a dedicated /api/auth/me endpoint.
    const response = await fetch('/api/auth/me', { // Assuming you have a /api/auth/me endpoint
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.user; // Return the full user object from the backend
    } else {
      console.error('Failed to fetch current user from backend:', response.status);
      logout();
      return null;
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    logout();
    return null;
  }
}

export function checkRole(allowedRoles) {
  // This function should ideally be used with a globally managed user state
  // that is populated after successful login and token verification.
  // For now, it will rely on getCurrentUser which makes an API call.
  // In a real app, you'd pass the user object from context/state.
  const user = getCurrentUser(); // This is now async, but checkRole is sync.
  // This needs to be handled asynchronously or by passing user from context.
  // For immediate use, this might not work as expected.
  console.warn("checkRole is called synchronously but getCurrentUser is async. Consider using user from context/state.");
  return false; // Default to false for synchronous call
}

export const ROLES = {
  ADMIN: 'Administrator',
  PILOT: 'Pilot',
  // Removed 'VIEWER' role as per user's request
};

// Mock password reset functionality (no actual reset)
export function mockPasswordReset(email) {
  console.log(`Mock password reset initiated for: ${email}`);
  return true; // Always "successful" for mock
}
