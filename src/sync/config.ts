/**
 * Firebase web config from the build environment (see `.env.example`). These values are public by design;
 * Firestore security rules are what keep each user's data private.
 */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Without config the app runs device-only, exactly as before accounts existed. */
export const cloudEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

/** Firebase (~190 KB gzipped) loads after first paint, and only when cloud sync is configured. */
export const loadCloud = () => import('./cloud')
