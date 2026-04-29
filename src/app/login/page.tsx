'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const successMsg = searchParams.get('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password');
        setLoading(false);
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      setError('Connection failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-lg">
          <div className="flex flex-col items-center text-center mb-lg">
            <img src="/logo.jpg" alt="AmksaSwitchify" className="w-20 h-20 rounded-xl shadow-sm mb-md" />
            <h1 className="font-h2 text-h2 text-on-surface">AmksaSwitchify</h1>
            <p className="text-body-sm text-on-surface-variant mt-xs">Login to your traffic control center</p>
          </div>

          {successMsg && (
            <div className="mb-md px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-body-sm">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-md">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-body-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@company.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-xs uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-slate-800 transition-colors shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
          </form>

          <div className="mt-lg pt-md border-t border-slate-100 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link href="/signup" className="text-secondary font-semibold hover:underline">Sign up</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-lg">Enterprise Traffic Hub</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-on-surface-variant">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
