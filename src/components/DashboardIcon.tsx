export function cardDescription(name: string): string {
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
  if (/(performance|coverage|kpi|target|supervisor|manage|cadre)/.test(n))
    return 'CHP service delivery across Population, Maternal Health, Child Health and WASH — all community services in one view.';
  if (/(user|engagement|behaviour|behavior|usage|activity|adoption)/.test(n))
    return 'App usage patterns, session activity trends, and user engagement metrics across facilities and counties.';
  return 'Interactive analytics, data visualisations, and exportable reports for evidence-based programme planning and review.';
}

export type IconName =
  | 'household'
  | 'pregnancy'
  | 'child'
  | 'immunization'
  | 'nutrition'
  | 'disease'
  | 'community'
  | 'performance'
  | 'engagement'
  | 'chart';

export const iconTheme: Record<IconName, { bg: string; color: string }> = {
  household:    { bg: '#cffafe', color: '#0e7490' },
  pregnancy:    { bg: '#fce7f3', color: '#be185d' },
  child:        { bg: '#ffedd5', color: '#c2410c' },
  immunization: { bg: '#dcfce7', color: '#15803d' },
  nutrition:    { bg: '#fef9c3', color: '#a16207' },
  disease:      { bg: '#fee2e2', color: '#b91c1c' },
  community:    { bg: '#ede9fe', color: '#6d28d9' },
  performance:  { bg: '#dbeafe', color: '#1d4ed8' },
  engagement:   { bg: '#fdf4ff', color: '#a21caf' },
  chart:        { bg: '#e0e7ff', color: '#4338ca' },
};

export function pickIcon(name: string): IconName {
  const n = name.toLowerCase();
  if (/(household|family|home)/.test(n)) return 'household';
  if (/(pregnan|antenatal|anc|maternal|delivery)/.test(n)) return 'pregnancy';
  if (/(child|under.?5|infant|newborn|neonatal)/.test(n)) return 'child';
  if (/(immuniz|vaccin)/.test(n)) return 'immunization';
  if (/(nutrition|growth|stunt|wasting)/.test(n)) return 'nutrition';
  if (/(malaria|tb|hiv|disease|illness|outbreak)/.test(n)) return 'disease';
  if (/(community|chu|chv|chp|worker)/.test(n)) return 'community';
  if (/(performance|coverage|kpi|target|supervisor|manage|cadre)/.test(n)) return 'performance';
  if (/(user|engagement|behaviour|behavior|usage|activity|adoption)/.test(n)) return 'engagement';
  return 'chart';
}

export function DashboardIcon({ name, color, size = 'md' }: { name: IconName; color: string; size?: 'sm' | 'md' }) {
  const common = {
    className: size === 'sm' ? 'w-4 h-4' : 'w-7 h-7',
    fill: 'none',
    viewBox: '0 0 24 24',
    strokeWidth: 1.6,
    stroke: color,
  };
  switch (name) {
    case 'household':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M8.25 21H3.75V3.545M3.75 3.545A2.25 2.25 0 0 1 6 1.5h12a2.25 2.25 0 0 1 2.25 2.045M3.75 3.545v.955M20.25 3.545v.955m0 0H3.75" />
        </svg>
      );
    case 'pregnancy':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    case 'child':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
      );
    case 'immunization':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
    case 'nutrition':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      );
    case 'disease':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
    case 'community':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
        </svg>
      );
    case 'performance':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      );
    case 'engagement':
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
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
