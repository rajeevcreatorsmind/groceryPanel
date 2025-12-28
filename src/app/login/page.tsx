'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Store, ShoppingBag, Leaf } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@freshgrocery.com');
  const [password, setPassword] = useState('Admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Real Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create or update user document in Firestore (prevents "Unable to load profile")
      await setDoc(
        doc(db, 'Admin', user.uid),
        {
          displayName: user.displayName || 'Admin User',
          email: user.email,
          phoneNumber: '',
          businessName: 'Sure Wholesaler',
          address: '',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        },
        { merge: true } // Only updates if exists, creates if not
      );

      // Optional: Store minimal info in localStorage if you need it elsewhere
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Admin User',
        role: 'admin',
      }));

      document.cookie = 'isLoggedIn=true; path=/; max-age=86400';

      router.push('/'); // Redirect to dashboard
    } catch (err: any) {
      console.error('Login error:', err);
      let message = 'Failed to sign in. Please try again.';
      if (err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        message = 'Network error. Check your internet connection.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Graphics */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)]"></div>
        </div>

        {/* Floating Icons */}
        <div className="absolute top-10 left-10 animate-float">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="absolute bottom-20 right-20 animate-float-delayed">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Leaf className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sure Wholesaler</h1>
              <p className="text-white/80">Grocery Management System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Manage Your Grocery Business <span className="text-yellow-300">Efficiently</span>
            </h2>
            <p className="text-white/90 text-lg">
              Track inventory, process orders, manage suppliers, and grow your grocery business with our comprehensive management platform.
            </p>
          </div>

          {/* Features List */}
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📦</span>
              </div>
              <span className="text-white font-medium">Inventory Management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
              <span className="text-white font-medium">Billing & POS</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">📊</span>
              </div>
              <span className="text-white font-medium">Sales Analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🚚</span>
              </div>
              <span className="text-white font-medium">Delivery Tracking</span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10">
          <p className="text-white/70 text-sm">
            Trusted by 500+ grocery stores across India
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Store className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Sure Wholesaler</h1>
                <p className="text-gray-600 text-sm">Grocery Management</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-600">Sign in to your admin dashboard</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all group-hover:border-green-400"
                    placeholder="admin@freshgrocery.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all group-hover:border-green-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to Dashboard
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials Card */}
            <div className="mt-8 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600">🔑</span>
                </div>
                <div>
                  <p className="font-medium text-yellow-800 mb-1">Demo Credentials</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-yellow-700">
                      <span className="font-medium">Email:</span> admin@freshgrocery.com
                    </p>
                    <p className="text-yellow-700">
                      <span className="font-medium">Password:</span> Admin123
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                <span className="text-green-600">🔒</span> Your data is securely encrypted
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2024 Sure Wholesaler. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              v2.1.0 • Last updated today
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
}