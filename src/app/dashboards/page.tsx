'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardConfig } from '@/lib/config';
import { DashboardIcon, pickIcon, iconTheme } from '@/components/DashboardIcon';

function cardDescription(name: string): string {
  const n = name.toLowerCase();
  if (/(household|family|home)/.test(n))
    return 'Household registration status, family composition data, and CHV visit coverage broken down by sub-county and community unit.';
  if (/(pregnan|antenatal|anc|maternal|delivery)/.test(n))
    return 'ANC attendance rates, skilled delivery coverage, postnatal care follow-up, and maternal health outcome trends across facilities.';
  if (/(child|under.?5|infant|newborn|neonatal)/.test(n))
    return 'Under-5 growth monitoring results, malnutrition screening trends, sick-child consultations, and referral completion rates.';
  if (/(immuniz|vaccin)/.test(n))
    return 'Vaccine coverage rates by antigen and age cohort, dropout and defaulter tracking, and cold-chain compliance by facility.';
  if (/(nutrition|growth|stunt|wasting)/.test(n))
    return 'MUAC screening outcomes, acute malnutrition prevalence, nutrition counselling coverage, and community-level referral rates.';
  if (/(malaria|tb|hiv|disease|illness|outbreak)/.test(n))
    return 'Disease incidence and prevalence trends, community-level outbreak alerts, and epidemiological surveillance data by ward.';
  if (/(community|chu|chv|chp|worker)/.test(n))
    return 'CHV activity rates, household visit completion, supervision scores, and community unit performance rankings by county.';
  if (/(performance|coverage|kpi|target)/.test(n))
    return 'Service coverage KPIs, target vs. achievement tracking, quarter-on-quarter trend analysis, and facility performance benchmarks.';
  if (/(supervisor|manage)/.test(n))
    return 'CHP service delivery across Population, Maternal Health, Child Health and WASH — all community services in one view.';
  if (/(user|engagement|behaviour|behavior|usage)/.test(n))
    return 'App usage patterns, session activity trends, and user engagement metrics across facilities and counties.';
  return 'Interactive analytics, data visualisations, and exportable reports for evidence-based programme planning and review.';
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

      {/* Top navigation bar */}
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
            className="text-sm font-medium font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Section hero band */}
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

      {/* Dashboard cards */}
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
