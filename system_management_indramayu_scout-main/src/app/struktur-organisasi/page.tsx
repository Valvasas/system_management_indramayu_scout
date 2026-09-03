"use client";
import { useLanguage } from "@/context/LanguageContext";
import { organizationStructure, kwartirRanting } from "@/lib/mock-data";

export default function StrukturOrganisasiPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-green-800 mb-8">{t("structure_title") || "Struktur Organisasi"}</h1>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Susunan Pengurus Kwarcab Indramayu</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {organizationStructure.map((dept, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
              <h3 className="font-bold text-lg mb-3 text-green-700">{dept.name}</h3>
              <ul className="space-y-2">
                {dept.members.map((member, midx) => (
                  <li key={midx} className="text-neutral-700 flex flex-col">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-neutral-500">{member.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">31 Kwartir Ranting (Kwarran)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {kwartirRanting.map((k, idx) => (
            <div key={idx} className="bg-neutral-100 px-4 py-3 rounded-md text-center text-sm font-medium text-neutral-800 border border-neutral-200 hover:bg-green-50 hover:border-green-300 transition-colors">
              {k.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
