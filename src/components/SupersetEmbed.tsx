'use client';

import { useEffect, useRef } from 'react';
import { embedDashboard } from '@superset-ui/embedded-sdk';

interface SupersetEmbedProps {
  dashboardId: string;
  supersetDomain: string;
}

export default function SupersetEmbed({ dashboardId, supersetDomain }: SupersetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const fetchGuestToken = async (): Promise<string> => {
      const res = await fetch('/api/superset/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardId }),
      });
      if (!res.ok) throw new Error('Failed to fetch guest token');
      const data = await res.json();
      return data.token;
    };

    embedDashboard({
      id: dashboardId,
      supersetDomain,
      mountPoint: containerRef.current,
      fetchGuestToken,
      dashboardUiConfig: {
        hideTitle: false,
        hideTab: false,
        hideChartControls: false,
        filters: { visible: true, expanded: false },
      },
    });
  }, [dashboardId, supersetDomain]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading dashboard...
      </div>
    </div>
  );
}
