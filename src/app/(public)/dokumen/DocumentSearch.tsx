'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';

/**
 * Pencarian dokumen yang menulis ke query param `cari` (P4-5) dengan debounce,
 * sehingga hasil pencarian bisa dibagikan lewat tautan. Tetap berfungsi sebagai
 * form biasa bila JavaScript gagal dimuat.
 */
export const DocumentSearch: React.FC<{ initialValue: string }> = ({ initialValue }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  useEffect(() => setValue(initialValue), [initialValue]);

  useEffect(() => {
    if (value === initialValue) return;
    const id = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set('cari', value.trim());
      else params.delete('cari');
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [value, initialValue, pathname, router, searchParams]);

  return (
    <form
      role="search"
      action={pathname}
      method="get"
      className="max-w-md"
      onSubmit={(e) => e.preventDefault()}
    >
      <Field id="cari" label="Cari dokumen">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            id="cari"
            name="cari"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Judul dokumen atau kata kunci"
            className="pl-9"
            maxLength={100}
          />
        </div>
      </Field>
    </form>
  );
};
