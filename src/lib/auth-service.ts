import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User,
  UserCredential,
} from 'firebase/auth';

/**
 * Sign up a new user with email and password
 * Automatically sends verification email after signup
 */
export async function signUp(email: string, password: string): Promise<UserCredential> {
  try {
    console.log('[Auth] 📝 Creating new user account...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send verification email
    await sendEmailVerification(userCredential.user);
    console.log('[Auth] ✅ User created successfully. Verification email sent to:', email);
    
    return userCredential;
  } catch (error: any) {
    console.error('[Auth] ❌ Error during signup:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign in existing user with email and password
 * Checks if email is verified before allowing login
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    console.log('[Auth] 🔑 Signing in user...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Check if email is verified
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      console.warn('[Auth] ⚠️ Email not verified');
      throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
    }
    
    console.log('[Auth] ✅ User signed in successfully:', email);
    return userCredential;
  } catch (error: any) {
    console.error('[Auth] ❌ Error during signin:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
}

/**
 * Sign out the current user
 */
export async function logOut(): Promise<void> {
  try {
    console.log('[Auth] 🚪 Signing out user...');
    await signOut(auth);
    console.log('[Auth] ✅ User signed out successfully');
  } catch (error: any) {
    console.error('[Auth] ❌ Error during signout:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Resend verification email to current user
 */
export async function resendVerificationEmail(user: User): Promise<void> {
  try {
    console.log('[Auth] 📧 Resending verification email...');
    await sendEmailVerification(user);
    console.log('[Auth] ✅ Verification email resent successfully');
  } catch (error: any) {
    console.error('[Auth] ❌ Error resending verification email:', error);
    throw new Error('Failed to resend verification email. Please try again later.');
  }
}

/**
 * Get user-friendly error messages for Firebase auth errors
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}

/**
 * Get the current user's ID (for Firestore document paths)
 */
export function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

/**
 * Check if user is authenticated and email is verified
 */
export function isUserAuthenticated(): boolean {
  const user = auth.currentUser;
  return user !== null && user.emailVerified;
}
