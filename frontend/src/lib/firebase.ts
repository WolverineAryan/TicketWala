import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Initialize Firebase only if API key exists
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google using popup
 */
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  if (!auth) {
    // Graceful fallback for local dev before keys are configured
    const simulatedUser = {
      uid: "user-aryan-01",
      displayName: "Aryan Sharma",
      email: "aryan@ticketwala.io",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan",
    } as unknown as User;

    return { user: simulatedUser };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (err: any) {
    return { user: null, error: err.message };
  }
}

/**
 * Sign out user
 */
export async function logOut(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}
