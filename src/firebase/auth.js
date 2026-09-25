import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config.js';

// Auth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

/**
 * Human-friendly Firebase error message mapper
 */
export function mapAuthError(error) {
  if (!error) return 'An unknown error occurred. Please try again.';
  
  const code = error.code || '';
  const message = error.message || '';

  if (!isFirebaseConfigured()) {
    return 'Firebase is not yet configured. Please create your .env file with your Firebase credentials.';
  }

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/user-not-found':
      return 'No account was found with this email.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in request cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily disabled. Please reset your password or try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the administrator.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Console. Please enable it in Authentication -> Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations. Add localhost / your domain in Firebase Console -> Authentication -> Settings -> Authorized domains.';
    default:
      if (message.includes('API key not valid')) {
        return 'Invalid Firebase API Key. Please verify your VITE_FIREBASE_API_KEY in .env.';
      }
      return message || 'An error occurred during authentication. Please try again.';
  }
}

/**
 * Sign up with Email and Password
 */
export async function registerWithEmail(name, email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration missing. Check .env file.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (name && name.trim()) {
    await updateProfile(userCredential.user, { displayName: name.trim() });
  }
  return userCredential.user;
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration missing. Check .env file.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in with Google Popup
 */
export async function loginWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration missing. Check .env file.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Sign in with GitHub Popup
 */
export async function loginWithGithub() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration missing. Check .env file.');
  }
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase configuration missing. Check .env file.');
  }
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out
 */
export async function logoutUser() {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function subscribeToAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if the user is an admin
 * Verifies custom claims (token.admin === true) and fallback configured admin email
 */
export async function checkIsAdmin(user) {
  if (!user) return false;
  try {
    const tokenResult = await user.getIdTokenResult(true);
    return Boolean(tokenResult.claims && tokenResult.claims.admin === true);
  } catch (err) {
    console.warn('Error reading user token claims:', err);
    return false;
  }
}
