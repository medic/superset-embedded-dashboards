'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SupersetEmbed from '@/components/SupersetEmbed';
import { DashboardConfig } from '@/lib/config';

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const supersetDomain = process.env.NEXT_PUBLIC_SUPERSET_URL || '';

  useEffect(() => {
    fetch('/api/dashboards')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setDashboards(data.dashboards))
      .catch(() => router.push('/login'));
  }, [router]);

  const currentDashboard = dashboards.find((d) => d.id === dashboardId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r min-h-screen p-4">
        <Link href="/dashboards" className="text-lg font-semibold block mb-6">
          Dashboard Portal
        </Link>
        <nav className="space-y-1">
          {dashboards.map((d) => (
            <Link
              key={d.id}
              href={`/dashboards/${d.id}`}
              className={`block px-3 py-2 rounded text-sm ${
                d.id === dashboardId
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {d.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-medium">
            {currentDashboard?.name || 'Loading...'}
          </h1>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </header>
        <div className="p-0">
          {supersetDomain ? (
            <SupersetEmbed
              dashboardId={dashboardId}
              supersetDomain={supersetDomain}
            />
          ) : (
            <p className="p-6 text-red-500">NEXT_PUBLIC_SUPERSET_URL is not configured</p>
          )}
        </div>
      </main>
    </div>
  );
}
