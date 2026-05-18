'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SupersetEmbed from '@/components/SupersetEmbed';
import { DashboardConfig } from '@/lib/config';
import { DashboardIcon, pickIcon, iconTheme } from '@/components/DashboardIcon';
import { useLogout } from '@/hooks/useLogout';

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;
  const handleLogout = useLogout();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/dashboards', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data: { dashboards: DashboardConfig[] }) => setDashboards(data.dashboards))
      .catch((err) => { if (err.name !== 'AbortError') router.push('/login'); });
    return () => controller.abort();
  }, [router]);

  return (
    <div className="h-screen overflow-hidden">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-56 bg-white border-r shadow-lg flex flex-col transition-transform duration-200 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navigation"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <span className="font-semibold text-sm text-gray-900">eCHIS Analytics</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded"
            aria-label="Close navigation"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/dashboards"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </span>
            Home
          </Link>
          <div className="h-px bg-slate-100 my-1" />
          {dashboards.map((d) => {
            const icon = pickIcon(d.name);
            const theme = iconTheme[icon];
            const isActive = d.id === dashboardId;
            return (
              <Link
                key={d.id}
                href={`/dashboards/${d.id}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: theme.bg }}
                >
                  <DashboardIcon name={icon} color={theme.color} size="sm" />
                </span>
                {d.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-500 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0 h-12 bg-white border-b flex items-center px-3 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4h14M1 8h14M1 12h14" />
            </svg>
          </button>
          <div className="w-px h-6 bg-slate-200 shrink-0" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kenya-coa.png"
            alt="Ministry of Health – Republic of Kenya"
            width={48}
            height={45}
            className="h-8 w-auto shrink-0"
          />
          <div className="w-px h-6 bg-slate-200 shrink-0" />
          <div>
            <p className="text-[9px] font-bold tracking-widest uppercase text-slate-400 leading-tight">Ministry of Health</p>
            <p className="text-[13px] font-bold text-slate-800 leading-tight">eCHIS Analytics</p>
          </div>
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <SupersetEmbed dashboardId={dashboardId} />
        </div>
      </main>

    </div>
  );
}
