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
    <div className="min-h-screen flex">

      {/* ── Left panel (2/3) ── */}
      <div
        className="hidden lg:flex lg:w-2/3 flex-col justify-between relative overflow-hidden px-14 py-12"
        style={{
          background: 'linear-gradient(145deg, #083a5e 0%, #0d5c82 45%, #0076A8 100%)',
        }}
      >
        {/* Background atmosphere circles */}
        <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 -left-24 w-[320px] h-[320px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 60%)' }} />

        {/* Top: coat of arms + platform name */}
        <div className="relative flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kenya-coa.png"
            alt="Ministry of Health – Republic of Kenya"
            width={48}
            height={45}
            className="h-12 w-auto shrink-0"
          />
          <div className="w-px h-10 bg-white/30" />
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-white/60">Ministry of Health</p>
            <p className="text-base font-bold text-white leading-tight">eCHIS Analytics</p>
          </div>
        </div>

        {/* Middle: headline content */}
        <div className="relative space-y-6 max-w-lg">
          <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
            Kenya eCHIS<br />Analytics Portal
          </h1>

          <p className="text-lg font-medium text-blue-100/85 leading-relaxed">
            Access real-time community health data and insights supporting evidence-based
            decision making across all 47 counties.
          </p>

          {/* Stat chips */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm">
              <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <span className="text-sm font-semibold text-white">47 Counties</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm">
              <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21 12 3l9.75 18H2.25Zm9.75-13.5v6M12 18.75h.008v.008H12v-.008Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21M3 9h18M3 15h18" />
              </svg>
              <span className="text-sm font-semibold text-white">10k+ CHUs</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 border border-white/15 backdrop-blur-sm">
              <svg className="w-4 h-4 text-blue-200 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v17.25h17.25M7.5 16.5l3.75-4.5 3 3 4.5-6" />
              </svg>
              <span className="text-sm font-semibold text-white">Real-time Data</span>
            </div>
          </div>
        </div>

        {/* Bottom: ministry label */}
        <div className="relative">
          <p className="text-xs text-white/40 font-medium">Ministry of Health · Republic of Kenya</p>
        </div>
      </div>

      {/* ── Right panel (1/3) ── */}
      <div className="flex-1 lg:w-1/3 flex items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm animate-fade-in-up">

          {/* Mobile-only header */}
          <div className="lg:hidden text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coat-of-arms.png"
              alt="Ministry of Health"
              width={200}
              height={54}
              className="mx-auto mb-4 h-10 w-auto"
            />
            <h1 className="text-xl font-semibold text-slate-800">eCHIS Analytics</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm font-medium text-slate-400">Enter your credentials to continue</p>
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
              style={{ backgroundColor: '#0076A8' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1589ba'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0076A8'; }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
