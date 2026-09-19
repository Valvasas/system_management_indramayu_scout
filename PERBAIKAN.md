# Context & Role
Bertindaklah sebagai Senior Full-Stack Developer dan UI/UX Designer profesional. Proyek ini adalah "Rumah Pramuka Indramayu" (website resmi informasi dan manajemen Kwarcab Gerakan Pramuka Indramayu) yang dibangun menggunakan Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React, dan Leaflet.

Semua perubahan kode wajib mematuhi aturan internal tim:
- Prinsip Visual: Mengusung estetika "Calm civic system with scouting character". Utamakan whitespace, keterbacaan, dan hierarki visual yang jelas.
- Larangan Keras: DILARANG menggunakan emoji OS bawaan (seperti ⚜️, 👤, 🏢, 🗺️) sebagai elemen dekorasi UI; ganti selalu dengan ikon vektor SVG semantik dari `lucide-react`.
- Standar Aksesibilitas: WCAG 2.2 Level AA (kontras warna memadai, focus-visible jelas, keyboard navigable, dan mobile-friendly).

---

## Task 1: Standardisasi Helper `cn` (`src/lib/utils.ts`)
Perbaiki file `src/lib/utils.ts` agar menggabungkan `clsx` dan `tailwind-merge` dengan benar untuk menyelesaikan konflik class Tailwind:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}