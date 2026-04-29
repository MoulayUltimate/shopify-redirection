'use client';

import { useState } from 'react';
import { signup } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);

    const res = await signup(formData);

    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/login?success=Account created. Please login.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[28rem]">
        <div className="bg-white border border-outline-variant rounded-xl shadow-sm p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <img src="/logo.jpg" alt="AmksaSwitchify" className="w-20 h-20 rounded-xl shadow-sm mb-4" />
            <h1 className="font-h2 text-h2 text-on-surface">Join AmksaSwitchify</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">Start smart traffic forwarding today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-body-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase">Email Address</label>
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
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 uppercase">Password</label>
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-body-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link href="/login" className="text-secondary font-semibold hover:underline">Login</Link>
            </p>
          </div>
        </div>
        <p className="text-center text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-lg">Enterprise Traffic Hub</p>
      </div>
    </div>
  );
}
