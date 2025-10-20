import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let isInitialized = false;

if (!admin.apps.length) {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

    // Only initialize if we have the required environment variables
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      
      isInitialized = true;
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('Firebase Admin environment variables not found. Admin features will be disabled.');
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
    // Don't throw during build time to allow the app to build
  }
}

// Export admin services only if initialization was successful
export const adminAuth = isInitialized ? admin.auth() : null;
export const adminDb = isInitialized ? admin.firestore() : null;
