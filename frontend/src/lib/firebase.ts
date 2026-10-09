import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, type User } from "firebase/auth";

const clean = (val?: string) => (val || "").replace(/^["']|["']$/g, "").trim();

const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

// Initialize Firebase only if API key and projectId are configured
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.projectId
);

const app = isFirebaseConfigured
  ? !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const auth = app ? getAuth(app) : null;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sign in with Google using popup with comprehensive error guidance
 */
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  if (!auth) {
    // If Firebase keys aren't configured yet, provide seamless local dev fallback
    const simulatedUser = {
      uid: "user-local-guest",
      displayName: "Aryan Sharma",
      email: "ticketwala.org@gmail.com",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan",
    } as unknown as User;

    return { user: simulatedUser };
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
      friendlyMessage = "Popup closed before sign-in completed.";
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
