'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import CountySelector from '@/components/CountySelector';
import counties from '../../../counties.json';

export default function LoginPage() {
  const router = useRouter();
  const [county, setCounty] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!county) {
      setError('Please select your county');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ county, username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboards');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse at top, #f1f0ed 0%, var(--login-bg) 60%)',
      }}
    >
      <div className="w-full max-w-md p-10 pt-12 bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-200/60 animate-fade-in-up">
        <div className="text-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/coat-of-arms.png"
            alt="CHIS Ministry of Health"
            width={273}
            height={73}
            className="mx-auto mb-6"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
            Superset Dashboards
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 font-medium">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="county" className="block text-sm font-medium text-slate-600 mb-1.5">
              County
            </label>
            <CountySelector
              id="county"
              counties={counties}
              value={county}
              onChange={setCounty}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-600 mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-slate-800 placeholder:text-slate-300 transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white focus:outline-none"
              autoComplete="username"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-600 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-stone-300 bg-stone-50/50 px-3.5 py-2.5 text-slate-800 placeholder:text-slate-300 transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:bg-white focus:outline-none"
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-white text-sm font-medium rounded-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1a9bd2' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1589ba'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a9bd2'}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
