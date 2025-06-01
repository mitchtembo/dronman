import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken'; // For client-side JWT decoding (not verification)

const TOKEN_KEY = 'jwt_token'; // Key for storing JWT in cookies/localStorage

export async function login(username, password) {
  try {
    // Use window.location.origin to dynamically get the base URL
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }

    const responseData = await response.json();
    const { token, user } = responseData.data; // Correctly destructure from data property
    // Set cookie with path: '/' to ensure it's accessible to all routes
    Cookies.set(TOKEN_KEY, token, { expires: 7, path: '/' }); // Store JWT in cookie, path fix
    return user;
  } catch (error) {
    console.error("Client-side login error:", error);
    return null;
  }
}

export function logout() {
  Cookies.remove(TOKEN_KEY);
  // Optionally clear any client-side user state
}

export function getCurrentUser() {
  if (typeof window === 'undefined') {
    // This function is primarily for client-side use.
    // For server-side (middleware), user info is attached to request.user after JWT verification.
    return null;
  }

  const token = Cookies.get(TOKEN_KEY);
  console.log('getCurrentUser: Token from cookie:', token ? 'Found' : 'Not Found');
  if (!token) {
    return null;
  }

  try {
    // Decode JWT to get user info. Note: This is decoding, not verifying.
    // Verification happens on the server-side via authMiddleware.
    const decoded = jwt.decode(token);
    console.log('getCurrentUser: Decoded JWT:', decoded);
    // Check if token is expired (client-side check)
    if (decoded.exp * 1000 < Date.now()) {
      console.log('getCurrentUser: Token expired, logging out.');
      logout(); // Clear expired token
      return null;
    }
    return decoded; // Returns { id, username, role, pilotId, exp, iat }
  } catch (error) {
    console.error("getCurrentUser: Error decoding JWT:", error);
    logout(); // Clear invalid token
    return null;
  }
}

export function checkRole(allowedRoles) {
  const user = getCurrentUser();
  if (!user) {
    return false;
  }
  return allowedRoles.includes(user.role);
}

// Mock password reset functionality (no actual reset)
export function mockPasswordReset(email) {
  console.log(`Mock password reset initiated for: ${email}`);
  return true; // Always "successful" for mock
}
