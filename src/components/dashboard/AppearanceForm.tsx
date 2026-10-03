'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { CheckboxField, FileField, TextField } from '@/components/forms/Fields';
import type { FormState } from '@/lib/forms';

export const AppearanceForm: React.FC<{
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  defaults: { heroImage: string | null; heroImageAlt: string; heroCaption: string };
}> = ({ action, defaults }) => (
  <ActionForm action={action}>
    <FileField
      name="heroImage"
      label={defaults.heroImage ? 'Ganti foto header' : 'Unggah foto header'}
      accept="image/jpeg,image/png,image/webp"
      hint="Foto mendatar (landscape), lebar minimal 1200 piksel, maks. 10 MB. Bagian kiri foto akan tertutup teks judul."
    />
    <CheckboxField
      name="consent"
      label="Foto aman untuk publik"
      description="Tidak menampilkan wajah peserta didik di bawah umur secara jelas (gunakan foto suasana/jarak jauh), dan pihak dewasa di foto telah memberi izin."
    />
    <TextField name="heroImageAlt" label="Deskripsi foto (untuk pembaca layar)" defaultValue={defaults.heroImageAlt} hint="Jelaskan isi foto, mis. 'Apel besar Hari Pramuka di Alun-alun Indramayu'." />
    <TextField name="heroCaption" label="Keterangan kecil di pojok foto" defaultValue={defaults.heroCaption} hint="Opsional, mis. 'Apel Hari Pramuka 2026'." />
    {defaults.heroImage && <CheckboxField name="removeHero" label="Hapus foto header" description="Beranda kembali memakai latar warna cokelat." />}
    <SubmitButton>
      <Save className="h-4 w-4" aria-hidden="true" />
      Simpan tampilan
    </SubmitButton>
  </ActionForm>
);
