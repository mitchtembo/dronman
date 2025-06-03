import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_ADMIN_SDK_KEY;

  if (!serviceAccountKey) {
    console.error('FIREBASE_ADMIN_SDK_KEY environment variable is not set.');
    // Depending on your application's needs, you might want to throw an error
    // or handle this more gracefully, e.g., by falling back to applicationDefault
    // if running in a Google Cloud environment.
    // For now, we'll exit or let it fail if credentials are truly missing.
    throw new Error('Firebase Admin SDK key is missing. Please set FIREBASE_ADMIN_SDK_KEY environment variable.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Error parsing Firebase Admin SDK key:', error);
    throw new Error('Invalid Firebase Admin SDK key format. Please ensure it is a valid JSON string.');
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
