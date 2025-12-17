import { auth } from './config';

export const login = async (email: string, password: string) => {
  try {
    // Dynamically import to avoid SSR issues
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get the user token
    const token = await userCredential.user.getIdToken();
    
    // Store in localStorage
    localStorage.setItem('firebase_token', token);
    localStorage.setItem('user_email', email);
    
    return { 
      success: true, 
      user: userCredential.user, 
      error: null 
    };
  } catch (error: any) {
    console.error('Login error:', error.code, error.message);
    
    let errorMessage = 'Login failed';
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Wrong email or password';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found. Check your email.';
    }
    
    return { 
      success: false, 
      user: null, 
      error: errorMessage 
    };
  }
};