import React from 'react';
import { GraduationCap, LucideIcon, Mountain, Sprout, Tent } from 'lucide-react';
import type { GolonganId } from '@/lib/golongan';

const icons: Record<GolonganId, LucideIcon> = {
  siaga: Sprout,
  penggalang: Tent,
  penegak: Mountain,
  pembina: GraduationCap,
};

/** Ikon garis sederhana per golongan, dalam kotak tint pasir. Dekoratif. */
export const GolonganIcon: React.FC<{ id: GolonganId }> = ({ id }) => {
  const Icon = icons[id];
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-tag-surface text-tag-text">
      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
};
