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
    const container = containerRef.current;
    if (!container) return;

    // Clear previous embed (safe: only removes SDK-created iframe children)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

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
      mountPoint: container,
      fetchGuestToken,
      dashboardUiConfig: {
        hideTitle: false,
        hideTab: false,
        hideChartControls: false,
        filters: { visible: true, expanded: false },
      },
    });

    return () => {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [dashboardId, supersetDomain]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading dashboard...
      </div>
    </div>
  );
}
