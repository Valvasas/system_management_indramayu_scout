import React from 'react';
import { Award, Trophy } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Section } from '../ui/Section';
import { getAchievements } from '@/lib/repositories';

export const AchievementPreview = async () => {
  const achievements = await getAchievements({ limit: 2 });

  return (
    <Section
      id="prestasi"
      title="Prestasi terkini"
      description="Capaian kontingen dan anggota Pramuka Indramayu."
      action={{ label: 'Semua prestasi', href: '/prestasi' }}
    >
      {achievements.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Belum ada prestasi tercatat"
          description="Capaian kontingen akan dicantumkan setelah diverifikasi bidang binamuda."
        />
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {achievements.map((item) => (
            <li key={item.id}>
              <Card className="h-full border-l-4 border-l-action-primary">
                <CardContent className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-lg font-bold leading-snug text-text-primary">
                      {item.title}
                    </h3>
                    <Badge tone="warning" icon={Award} className="shrink-0">
                      {item.year}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium text-text-secondary">
                    Tingkat {item.level} · {item.recipient}
                  </p>
                  <p className="mt-3 text-sm text-text-secondary">{item.description}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};
