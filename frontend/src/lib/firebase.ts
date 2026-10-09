import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";

const clean = (val?: string) => (val || "").replace(/^["']|["']$/g, "").trim();

const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || "AIzaSyCqLmKL765b0z4aXp0C4PlGHlTWOUQ4nNM",
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || "ticketwala-5541e.firebaseapp.com",
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || "ticketwala-5541e",
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || "ticketwala-5541e.firebasestorage.app",
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || "8476736053",
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || "1:8476736053:web:ffea10c8a617d797fb8f7c",
};

// Initialize Firebase App
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign in with Google using authentic Firebase popup
 */
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  if (!auth) {
    return { user: null, error: "Firebase Authentication is not initialized." };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (err: any) {
    let friendlyMessage = err.message || "Failed to sign in with Google.";

    if (err.code === "auth/operation-not-allowed") {
      friendlyMessage = "Google Sign-In is not enabled yet in your Firebase Project. In Firebase Console, go to Authentication > Sign-in method > Google, toggle 'Enable' and click Save.";
    } else if (err.code === "auth/unauthorized-domain") {
      friendlyMessage = "Domain not authorized. In Firebase Console, go to Authentication > Settings > Authorized domains and add 'localhost' and '127.0.0.1'.";
    } else if (err.code === "auth/popup-blocked") {
      friendlyMessage = "Google sign-in popup was blocked by your browser. Please allow popups for localhost:3000.";
    } else if (err.code === "auth/popup-closed-by-user") {
      friendlyMessage = "Google sign-in popup was closed before completing.";
    } else if (err.code === "auth/cancelled-popup-request") {
      friendlyMessage = "Another sign-in popup is already active.";
    }

    console.warn("Firebase Auth Note:", err.code, friendlyMessage);
    return { user: null, error: friendlyMessage };
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
