'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SupersetEmbed from '@/components/SupersetEmbed';
import { DashboardConfig } from '@/lib/config';
import { DashboardIcon, pickIcon, iconTheme } from '@/components/DashboardIcon';

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/dashboards')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data: { dashboards: DashboardConfig[] }) => setDashboards(data.dashboards))
      .catch(() => router.push('/login'));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

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
