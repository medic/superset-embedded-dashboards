'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardConfig } from '@/lib/config';

type IconName =
  | 'household'
  | 'pregnancy'
  | 'child'
  | 'immunization'
  | 'nutrition'
  | 'disease'
  | 'community'
  | 'performance'
  | 'chart';

function pickIcon(name: string): IconName {
  const n = name.toLowerCase();
  if (/(household|family|home)/.test(n)) return 'household';
  if (/(pregnan|antenatal|anc|maternal|delivery)/.test(n)) return 'pregnancy';
  if (/(child|under.?5|infant|newborn|neonatal)/.test(n)) return 'child';
  if (/(immuniz|vaccin)/.test(n)) return 'immunization';
  if (/(nutrition|growth|stunt|wasting)/.test(n)) return 'nutrition';
  if (/(malaria|tb|hiv|disease|illness|outbreak)/.test(n)) return 'disease';
  if (/(community|chu|chv|chp|worker)/.test(n)) return 'community';
  if (/(performance|coverage|kpi|target)/.test(n)) return 'performance';
  return 'chart';
}

function DashboardIcon({ name }: { name: IconName }) {
  const common = {
    className: 'w-6 h-6',
    fill: 'none',
    viewBox: '0 0 24 24',
    strokeWidth: 1.7,
    stroke: 'currentColor',
  };
  switch (name) {
    case 'household':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 12 3l9.75 9M4.5 10.5V21h15V10.5M9.75 21v-6h4.5v6" />
        </svg>
      );
    case 'pregnancy':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a4.5 4.5 0 0 1-4.5-4.5V11a6 6 0 1 1 12 0v.75a3.75 3.75 0 0 1-3.75 3.75H13.5V16.5A4.5 4.5 0 0 1 12 21Z" />
        </svg>
      );
    case 'child':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm-3.75 3.75 3.75-2.25 3.75 2.25M9 21v-6.75L12 12l3 2.25V21" />
        </svg>
      );
    case 'immunization':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14 4 6 6m-3-3-9.5 9.5L4 20l3.5-3.5L17 7m-6 6 2 2" />
        </svg>
      );
    case 'nutrition':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.5 0-7.5-3.6-7.5-8.25 0-3 1.8-5.25 4.5-5.25 1.5 0 2.4.75 3 1.5.6-.75 1.5-1.5 3-1.5 2.7 0 4.5 2.25 4.5 5.25C19.5 17.4 16.5 21 12 21Zm0-15c.75-1.5 2.25-3 4.5-3" />
        </svg>
      );
    case 'disease':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36-2.12 2.12M7.76 16.24l-2.12 2.12m12.72 0-2.12-2.12M7.76 7.76 5.64 5.64M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      );
    case 'community':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      );
    case 'performance':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v17.25h17.25M7.5 16.5l3.75-4.5 3 3 4.5-6" />
        </svg>
      );
  }
}

export default function DashboardsPage() {
  const router = useRouter();
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboards')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setDashboards(data.dashboards))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/coat-of-arms.png"
              alt="CHIS Ministry of Health"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-semibold tracking-tight text-slate-800">eCHIS Analytics</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-lg font-medium mb-4">Available Dashboards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <Link
              key={d.id}
              href={`/dashboards/${d.id}`}
              className="group block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-100 transition-colors">
                  <DashboardIcon name={pickIcon(d.name)} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-blue-600 truncate">{d.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">Click to view</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
