import React from 'react';
import { getHomeStats } from '@/lib/repositories';

export const StatsSection = async () => {
  const stats = await getHomeStats();

  return (
    <section aria-labelledby="stats-title" className="bg-surface-base border-b border-border-subtle">
      <div className="civic-container py-10 sm:py-12">
        <h2 id="stats-title" className="sr-only">
          Statistik organisasi
        </h2>
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dd className="font-display text-3xl sm:text-4xl font-bold text-text-accent">
                {stat.value}
              </dd>
              <dt className="mt-1 text-sm font-medium text-text-primary">{stat.label}</dt>
              <p className="text-xs text-text-secondary">{stat.note}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
