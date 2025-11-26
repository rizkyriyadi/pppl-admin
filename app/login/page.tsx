'use client';

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { User, Lock, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Auto-append @gmail.com if email doesn't contain @ (optional, but keeping consistent with previous logic if needed, 
      // though user asked for specific credentials so maybe strictly email is better. 
      // The user said "ubah cred untuk loginnya menjadi : admin@sdntugu1.sch.id". 
      // So I will assume full email input or handle the specific domain if they just type 'admin'.
      // Let's stick to standard email input for now, or the previous logic if it helps.)

      // Previous logic was: const loginEmail = email.includes('@') ? email : `${email}@gmail.com`;
      // But now we want admin@sdntugu1.sch.id. 
      // Let's just use the input as is, assuming they type the full email.

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (!userDoc.exists()) {
        setError('User data not found');
        await auth.signOut();
        setIsSubmitting(false);
        return;
      }

      const userData = userDoc.data();

      if (userData.role !== 'admin' && userData.role !== 'superadmin') {
        setError('Access denied. Admin credentials required.');
        await auth.signOut();
        setIsSubmitting(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(135deg, #639EFF 0%, #A8C8FF 50%, #7BB4FF 100%)' }}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-center mb-2">
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Admin Panel
              </span>
            </h1>
            <p className="text-gray-600 text-sm">
              SDN TUGU 1
            </p>
          </div>

          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@sdntugu1.sch.id"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Lock className="w-4 h-4 mr-2 text-blue-600" />
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password"
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-3 py-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    className="w-5 h-5 border border-gray-300 rounded cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-700 cursor-pointer">
                    Ingat saya
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email || !password}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors duration-300 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed font-semibold text-base shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Masuk Sekarang...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Masuk Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Admin Panel Access Only
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
