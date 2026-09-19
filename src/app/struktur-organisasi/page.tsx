'use client';

import React from 'react';
import { mockOrganization, mockKwarrans } from '@/lib/data/mock-data';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function StrukturOrganisasiPage() {
  const { t } = useLanguage();

  const departments = mockOrganization.reduce<Record<string, typeof mockOrganization>>((acc, member) => {
    (acc[member.department] ||= []).push(member);
    return acc;
  }, {});

  return (
    <div className="civic-container py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-8">
        {t('nav.organization')}
      </h1>

      <section className="mb-12" aria-labelledby="pengurus-heading">
        <h2 id="pengurus-heading" className="text-2xl font-semibold mb-6">
          Susunan Pengurus Kwarcab Indramayu
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(departments).map(([department, members]) => (
            <div
              key={department}
              className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200"
            >
              <h3 className="font-bold text-lg mb-3 text-green-700">{department}</h3>
              <ul className="space-y-2">
                {members.map((member) => (
                  <li key={member.id} className="text-neutral-700 flex flex-col">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-neutral-600">{member.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="kwarran-heading">
        <h2 id="kwarran-heading" className="text-2xl font-semibold mb-6">
          {mockKwarrans.length} Kwartir Ranting (Kwarran)
        </h2>
        <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mockKwarrans.map((k) => (
            <li
              key={k.id}
              className="bg-neutral-100 px-4 py-3 rounded-md text-center text-sm font-medium text-neutral-800 border border-neutral-200"
            >
              {k.name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
