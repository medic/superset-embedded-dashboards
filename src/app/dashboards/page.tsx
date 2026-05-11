'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardConfig } from '@/lib/config';
import { DashboardIcon, pickIcon, iconTheme, cardDescription } from '@/components/DashboardIcon';
import { useLogout } from '@/hooks/useLogout';

export default function DashboardsPage() {
  const router = useRouter();
  const handleLogout = useLogout();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/dashboards', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setDashboards(data.dashboards))
      .catch((err) => { if (err.name !== 'AbortError') router.push('/login'); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5f4]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0076A8]/25 border-t-[#0076A8] rounded-full animate-spin-slow mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading dashboards…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f5f4]">

      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/kenya-coa.png"
              alt="Ministry of Health – Republic of Kenya"
              width={48}
              height={45}
              className="h-11 w-auto shrink-0"
            />
            <div className="w-px h-9 bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 leading-tight">Ministry of Health</p>
              <p className="text-[15px] font-bold text-slate-800 leading-tight">eCHIS Analytics</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="bg-[#0076A8]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-2">
            Data &amp; Analytics
          </p>
          <h2 className="text-3xl font-bold text-white">CHA Analytics Dashboards</h2>
          <p className="mt-2.5 text-blue-50 text-[15px] font-medium max-w-2xl leading-relaxed">
            Access real-time health data and insights to support evidence-based decision making
            across Kenya&apos;s community health programme.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {dashboards.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v17.25h17.25M7.5 16.5l3.75-4.5 3 3 4.5-6" />
            </svg>
            <p className="text-sm">No dashboards configured.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((d) => {
              const icon = pickIcon(d.name);
              const theme = iconTheme[icon];
              return (
                <Link
                  key={d.id}
                  href={`/dashboards/${d.id}`}
                  className="group block bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl mb-5"
                    style={{ backgroundColor: theme.bg }}
                  >
                    <DashboardIcon name={icon} color={theme.color} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-2">{d.name}</h3>
                  <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                    {cardDescription(d.name)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
