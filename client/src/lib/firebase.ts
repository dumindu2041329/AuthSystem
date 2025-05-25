import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  UserCredential, 
  signOut 
} from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider to allow account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    // First try to get any redirect result
    const result = await getRedirectResult(auth);
    if (result) {
      return result;
    }
    
    // On mobile devices, use redirect for a better UX
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // For mobile, use redirect flow
      await signInWithRedirect(auth, googleProvider);
      // This won't be reached immediately as page will redirect
      throw new Error("Redirecting to Google sign-in...");
    } else {
      // For desktop, try popup first
      try {
        return await signInWithPopup(auth, googleProvider);
      } catch (popupError) {
        console.error("Popup blocked or failed, using redirect instead:", popupError);
        // Fall back to redirect if popup fails
        await signInWithRedirect(auth, googleProvider);
        throw new Error("Redirecting to Google sign-in...");
      }
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Sign out
export const firebaseSignOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

export { auth };