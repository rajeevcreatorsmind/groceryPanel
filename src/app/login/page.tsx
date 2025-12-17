'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  console.log('🔵 [RENDER] Login page rendering');
  console.log('🔵 [STATE] email:', email, 'password:', password, 'loading:', loading, 'error:', error);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🟡 [SUBMIT] Form submitted');
    console.log('🟡 [DATA] Email:', email, 'Password:', password);
    
    setError('');
    setLoading(true);
    console.log('🟡 [LOADING] Set loading to true');

    try {
      console.log('🔵 [TRY] Starting try block');
      
      // Check if Firebase is available
      console.log('🔵 [FIREBASE] Checking Firebase availability...');
      if (typeof window === 'undefined') {
        console.error('❌ [ERROR] Firebase cannot run on server');
        throw new Error('Firebase client-side only');
      }

      // Import Firebase
      console.log('🔵 [IMPORT] Importing Firebase modules...');
      const firebase = await import('firebase/app');
      const authModule = await import('firebase/auth');
      
      console.log('✅ [IMPORT] Firebase modules loaded successfully');
      console.log('🔵 [FIREBASE] firebase:', !!firebase, 'auth:', !!authModule);

      // Initialize Firebase with YOUR config
      console.log('🔵 [CONFIG] Creating Firebase config...');
      const firebaseConfig = {
        apiKey: "AIzaSyCC3ocZbmqZyCo003MnBzOm9WDFB_lsLdc",
        authDomain: "creator-mind-9e81d.firebaseapp.com",
        projectId: "creator-mind-9e81d",
        storageBucket: "creator-mind-9e81d.firebasestorage.app",
        messagingSenderId: "634836105720",
        appId: "1:634836105720:web:112c9fbc1d079b44743e0d",
        measurementId: "G-VK4KCX4QGL"
      };

      console.log('🔵 [INIT] Initializing Firebase app...');
      let app;
      if (firebase.getApps().length === 0) {
        app = firebase.initializeApp(firebaseConfig);
        console.log('✅ [INIT] New Firebase app initialized');
      } else {
        app = firebase.getApps()[0];
        console.log('✅ [INIT] Using existing Firebase app');
      }

      // Get auth instance
      console.log('🔵 [AUTH] Getting auth instance...');
      const auth = authModule.getAuth(app);
      console.log('✅ [AUTH] Auth instance created');

      // Try to login
      console.log('🔵 [LOGIN] Calling signInWithEmailAndPassword...');
      console.log('🟡 [CREDS] Email:', email, 'Password Length:', password.length);
      
      const userCredential = await authModule.signInWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      console.log('✅ [LOGIN] Firebase login SUCCESS!');
      console.log('🟢 [USER] User details:', {
        email: userCredential.user?.email,
        uid: userCredential.user?.uid,
        displayName: userCredential.user?.displayName
      });

      // Get token
      console.log('🔵 [TOKEN] Getting user token...');
      const token = await userCredential.user.getIdToken();
      console.log('✅ [TOKEN] Token received (length):', token.length);

      // Save to localStorage
      console.log('🔵 [STORAGE] Saving to localStorage...');
      localStorage.setItem('firebase_token', token);
      localStorage.setItem('user_email', email);
      console.log('✅ [STORAGE] Saved to localStorage');

      // SUCCESS - Force redirect
      console.log('🟢 [REDIRECT] Redirecting to /dashboard...');
      console.log('🟢 [SUCCESS] LOGIN COMPLETE!');
      
      // Force page reload to dashboard
      window.location.href = '/dashboard';

    } catch (error: any) {
      console.error('❌ [CATCH] Error caught in catch block!');
      console.error('❌ [ERROR] Full error object:', error);
      console.error('❌ [ERROR] Error name:', error.name);
      console.error('❌ [ERROR] Error message:', error.message);
      console.error('❌ [ERROR] Error code:', error.code);
      console.error('❌ [ERROR] Error stack:', error.stack);

      let errorMessage = 'Login failed';
      
      if (error.code) {
        console.log('🔵 [ERROR_CODE] Firebase error code:', error.code);
        
        switch(error.code) {
          case 'auth/invalid-credential':
            errorMessage = '❌ Wrong email or password';
            break;
          case 'auth/user-not-found':
            errorMessage = '❌ User not found. Check your email.';
            break;
          case 'auth/wrong-password':
            errorMessage = '❌ Wrong password. Try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = '❌ Too many attempts. Try later.';
            break;
          case 'auth/network-request-failed':
            errorMessage = '❌ Network error. Check internet.';
            break;
          default:
            errorMessage = `❌ Error: ${error.code}`;
        }
      } else if (error.message) {
        console.log('🔵 [ERROR_MSG] Generic error message:', error.message);
        errorMessage = `❌ Error: ${error.message}`;
      }
      
      console.error('❌ [FINAL_ERROR] Displaying to user:', errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  const testLogin = () => {
    console.log('🟡 [TEST] Setting test credentials...');
    setEmail('demo@surewholesaler.com');
    setPassword('Demo@123');
    console.log('✅ [TEST] Credentials set');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sure Wholesaler - DEBUG</h1>
        
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <strong>Open DevTools (F12) → Console tab</strong>
            <br/>See all logs there
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            <strong>ERROR:</strong> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                console.log('🔵 [INPUT] Email changed:', e.target.value);
                setEmail(e.target.value);
              }}
              className="w-full p-3 border rounded"
              placeholder="Enter email"
              required
              autoComplete="email"
            />
          </div>
          
          <div>
            <label className="block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                console.log('🔵 [INPUT] Password changed, length:', e.target.value.length);
                setPassword(e.target.value);
              }}
              className="w-full p-3 border rounded"
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 p-3 rounded font-medium ${
                loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <button
              type="button"
              onClick={testLogin}
              className="p-3 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Fill Test
            </button>
          </div>
        </form>
        
        <div className="mt-6 p-3 bg-gray-50 rounded">
          <h3 className="font-bold mb-2">Test Credentials:</h3>
          <p>Email: <code className="bg-gray-200 px-2">demo@surewholesaler.com</code></p>
          <p>Password: <code className="bg-gray-200 px-2">Demo@123</code></p>
          <button 
            onClick={testLogin}
            className="mt-2 text-sm text-blue-600 underline"
          >
            Click to auto-fill
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Steps to debug:</strong></p>
          <ol className="list-decimal pl-4 mt-2">
            <li>Open Chrome DevTools (F12)</li>
            <li>Go to Console tab</li>
            <li>Click "Fill Test" button</li>
            <li>Click "Login" button</li>
            <li>Check console for all logs</li>
            <li>Share screenshots of errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}