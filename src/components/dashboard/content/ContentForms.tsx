'use client';

import React from 'react';
import { Save, Upload } from 'lucide-react';
import { ActionForm, SubmitButton } from '@/components/forms/ActionForm';
import { CheckboxField, FieldGroup, FileField, SelectField, TextAreaField, TextField } from '@/components/forms/Fields';
import type { FormState } from '@/lib/forms';

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const toOptions = (values: string[]) => values.map((v) => ({ value: v, label: v }));

const SaveButton: React.FC<{ children?: React.ReactNode }> = ({ children = 'Simpan' }) => (
  <SubmitButton>
    <Save className="h-4 w-4" aria-hidden="true" />
    {children}
  </SubmitButton>
);

/* ---------------- Berita ---------------- */

export interface NewsDefaults {
  title?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  author?: string;
  tags?: string[];
  status?: string;
  publishedAt?: string;
  hasCover?: boolean;
}

/**
 * `editor` (content.manage): semua status termasuk Tayang & tanggal terbit.
 * `contributor` (content.contribute): hanya simpan draf atau kirim untuk review.
 */
export const NewsForm: React.FC<{ action: Action; categories: string[]; defaults?: NewsDefaults; defaultAuthor: string; mode?: 'editor' | 'contributor' }> = ({
  action,
  categories,
  defaults = {},
  defaultAuthor,
  mode = 'editor',
}) => (
  <ActionForm action={action} aria-label="Formulir berita">
    <FieldGroup title="Isi berita">
      <TextField name="title" label="Judul" defaultValue={defaults.title} maxLength={180} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Kategori" defaultValue={defaults.category ?? categories[0]} options={toOptions(categories)} required />
        <TextField name="author" label="Penulis" defaultValue={defaults.author ?? defaultAuthor} required />
      </div>
      <TextAreaField
        name="excerpt"
        label="Ringkasan"
        rows={3}
        maxLength={300}
        defaultValue={defaults.excerpt}
        hint="Tampil di daftar berita dan hasil pencarian. Maksimal 300 karakter."
        required
      />
      <TextAreaField
        name="content"
        label="Isi berita"
        rows={14}
        defaultValue={defaults.content}
        hint="Pisahkan paragraf dengan satu baris kosong."
        required
      />
      <TextField name="tags" label="Tag" defaultValue={defaults.tags?.join(', ')} hint="Pisahkan dengan koma, maksimal 10." />
    </FieldGroup>

    <FieldGroup title="Gambar sampul" description="Gunakan foto kegiatan tanpa wajah anak yang dapat dikenali. Metadata lokasi (GPS) otomatis dihapus.">
      <FileField name="cover" label="Foto sampul" accept="image/jpeg,image/png,image/webp" hint="JPG, PNG, atau WEBP, maksimal 10 MB." />
      {defaults.hasCover && <CheckboxField name="removeCover" label="Hapus sampul saat ini" />}
    </FieldGroup>

    {mode === 'editor' ? (
      <FieldGroup title="Penayangan">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            name="status"
            label="Status"
            defaultValue={defaults.status ?? 'DRAFT'}
            options={[
              { value: 'DRAFT', label: 'Draf (belum tayang)' },
              { value: 'REVIEW', label: 'Menunggu review' },
              { value: 'PUBLISHED', label: 'Tayang' },
              { value: 'ARCHIVED', label: 'Arsip' },
            ]}
            required
          />
          <TextField name="publishedAt" label="Tanggal terbit" type="date" defaultValue={defaults.publishedAt} hint="Kosongkan untuk memakai hari ini." />
        </div>
      </FieldGroup>
    ) : (
      <FieldGroup title="Kirim" description="Berita tidak langsung tayang. Editor Kwarcab akan memeriksa, lalu menerbitkan atau mengembalikannya dengan catatan.">
        <SelectField
          name="status"
          label="Tindakan"
          defaultValue={defaults.status === 'REVIEW' ? 'REVIEW' : 'DRAFT'}
          options={[
            { value: 'DRAFT', label: 'Simpan sebagai draf' },
            { value: 'REVIEW', label: 'Kirim untuk direview' },
          ]}
          required
        />
      </FieldGroup>
    )}
    <SaveButton />
  </ActionForm>
);

/** Editor mengembalikan berita kontributor dengan catatan yang jelas. */
export const ReturnNewsForm: React.FC<{ action: Action }> = ({ action }) => (
  <ActionForm action={action} aria-label="Kembalikan berita ke penulis" className="space-y-3">
    <TextAreaField name="reviewNote" label="Catatan untuk penulis" rows={3} maxLength={1000} hint="Sebutkan apa yang perlu diperbaiki, mis. foto menampilkan wajah anak, tanggal kegiatan kurang." required />
    <SubmitButton variant="outline">Kembalikan ke penulis</SubmitButton>
  </ActionForm>
);

/* ---------------- Agenda ---------------- */

export interface EventDefaults {
  title?: string;
  dateStart?: string;
  dateEnd?: string;
  location?: string;
  organizer?: string;
  description?: string;
  contactPerson?: string | null;
  published?: boolean;
  cancelled?: boolean;
  registrationOpen?: boolean;
}

export const EventForm: React.FC<{ action: Action; defaults?: EventDefaults }> = ({ action, defaults = {} }) => (
  <ActionForm action={action} aria-label="Formulir agenda">
    <FieldGroup title="Kegiatan">
      <TextField name="title" label="Nama kegiatan" defaultValue={defaults.title} maxLength={180} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="dateStart" label="Mulai" type="datetime-local" defaultValue={defaults.dateStart} hint="Waktu Indonesia Barat (WIB)." required />
        <TextField name="dateEnd" label="Selesai" type="datetime-local" defaultValue={defaults.dateEnd} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="location" label="Lokasi" defaultValue={defaults.location} required />
        <TextField name="organizer" label="Penyelenggara" defaultValue={defaults.organizer ?? 'Kwarcab Indramayu'} required />
      </div>
      <TextAreaField name="description" label="Deskripsi" rows={6} defaultValue={defaults.description} required />
      <TextField name="contactPerson" label="Narahubung" defaultValue={defaults.contactPerson ?? ''} hint="Nama dan nomor yang bisa dihubungi (opsional)." />
    </FieldGroup>
    <FieldGroup title="Penayangan">
      <CheckboxField name="published" label="Tayangkan di situs publik" defaultChecked={defaults.published} />
      <CheckboxField
        name="registrationOpen"
        label="Buka pendaftaran lewat portal"
        description="Peserta aktif dapat mendaftar dari dasbor mereka."
        defaultChecked={defaults.registrationOpen}
      />
      <CheckboxField name="cancelled" label="Kegiatan dibatalkan" description="Tetap tampil dengan label Dibatalkan." defaultChecked={defaults.cancelled} />
    </FieldGroup>
    <SaveButton />
  </ActionForm>
);

/* ---------------- Galeri ---------------- */

export interface AlbumDefaults {
  title?: string;
  date?: string;
  location?: string;
  organizer?: string;
  category?: string;
  description?: string;
  published?: boolean;
}

export const AlbumForm: React.FC<{ action: Action; categories: string[]; defaults?: AlbumDefaults }> = ({ action, categories, defaults = {} }) => (
  <ActionForm action={action} aria-label="Formulir album">
    <FieldGroup title="Informasi album">
      <TextField name="title" label="Judul album" defaultValue={defaults.title} maxLength={180} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="date" label="Tanggal kegiatan" type="date" defaultValue={defaults.date} required />
        <SelectField name="category" label="Kategori" defaultValue={defaults.category ?? categories[0]} options={toOptions(categories)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="location" label="Lokasi" defaultValue={defaults.location} required />
        <TextField name="organizer" label="Penyelenggara" defaultValue={defaults.organizer ?? 'Kwarcab Indramayu'} required />
      </div>
      <TextAreaField name="description" label="Deskripsi" rows={4} defaultValue={defaults.description} />
      <CheckboxField name="published" label="Tayangkan album di situs publik" defaultChecked={defaults.published} />
    </FieldGroup>
    <SaveButton />
  </ActionForm>
);

export const PhotoUploadForm: React.FC<{ action: Action }> = ({ action }) => (
  <ActionForm action={action} resetOnSuccess aria-label="Unggah foto">
    <FileField name="photos" label="Pilih foto" accept="image/jpeg,image/png,image/webp" multiple hint="Sampai 20 foto sekali unggah, masing-masing maksimal 10 MB." required />
    <TextField name="caption" label="Keterangan (opsional)" hint="Dipakai untuk semua foto yang diunggah kali ini." maxLength={200} />
    <CheckboxField
      name="consent"
      label="Foto ini aman dipublikasikan"
      description="Saya sudah memastikan tidak ada wajah anak yang dapat dikenali tanpa izin wali, dan tidak ada data pribadi yang terlihat."
    />
    <SubmitButton pendingLabel="Mengunggah">
      <Upload className="h-4 w-4" aria-hidden="true" />
      Unggah foto
    </SubmitButton>
  </ActionForm>
);

export const PhotoCaptionForm: React.FC<{ action: Action; caption: string; altText: string }> = ({ action, caption, altText }) => (
  <ActionForm action={action} aria-label="Keterangan foto" className="space-y-3">
    <TextField name="caption" label="Keterangan" defaultValue={caption} maxLength={200} required />
    <TextField name="altText" label="Teks alternatif" defaultValue={altText} maxLength={250} hint="Deskripsikan isi foto untuk pembaca layar." required />
    <SubmitButton>Simpan keterangan</SubmitButton>
  </ActionForm>
);

/* ---------------- Dokumen ---------------- */

export interface DocumentDefaults {
  title?: string;
  category?: string;
  description?: string | null;
  date?: string;
  published?: boolean;
  fileName?: string | null;
}

export const DocumentForm: React.FC<{ action: Action; categories: string[]; defaults?: DocumentDefaults }> = ({ action, categories, defaults = {} }) => (
  <ActionForm action={action} aria-label="Formulir dokumen">
    <FieldGroup title="Informasi dokumen">
      <TextField name="title" label="Judul dokumen" defaultValue={defaults.title} maxLength={200} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="category" label="Kategori" defaultValue={defaults.category ?? categories[0]} options={toOptions(categories)} required />
        <TextField name="date" label="Tanggal dokumen" type="date" defaultValue={defaults.date} required />
      </div>
      <TextAreaField name="description" label="Keterangan singkat" rows={3} maxLength={500} defaultValue={defaults.description ?? ''} />
    </FieldGroup>
    <FieldGroup title="Berkas">
      <FileField
        name="file"
        label={defaults.fileName ? 'Ganti berkas' : 'Berkas'}
        accept=".pdf,.docx,.xlsx,.pptx"
        hint={defaults.fileName ? `Berkas saat ini: ${defaults.fileName}. Kosongkan bila tidak diganti.` : 'PDF, DOCX, XLSX, atau PPTX, maksimal 15 MB.'}
      />
      <CheckboxField name="published" label="Tayangkan di Pusat Dokumen" description="Dokumen hanya bisa tayang bila berkasnya sudah diunggah." defaultChecked={defaults.published} />
    </FieldGroup>
    <SaveButton />
  </ActionForm>
);

/* ---------------- Pengurus ---------------- */

export interface BoardDefaults {
  name?: string;
  position?: string;
  department?: string;
  period?: string;
  sortOrder?: number;
}

export const BoardForm: React.FC<{ action: Action; defaults?: BoardDefaults }> = ({ action, defaults = {} }) => (
  <ActionForm action={action} aria-label="Formulir pengurus">
    <FieldGroup title="Data pengurus">
      <TextField name="name" label="Nama" defaultValue={defaults.name} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="position" label="Jabatan" defaultValue={defaults.position} required />
        <TextField name="department" label="Bidang" defaultValue={defaults.department} hint="Mis. Pimpinan, Organisasi, Pembinaan." required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="period" label="Masa bakti" defaultValue={defaults.period ?? '2024–2029'} required />
        <TextField name="sortOrder" label="Urutan tampil" type="number" min={0} max={999} defaultValue={defaults.sortOrder ?? 0} hint="Angka kecil tampil lebih dulu." required />
      </div>
    </FieldGroup>
    <SaveButton />
  </ActionForm>
);

/* ---------------- Prestasi ---------------- */

export interface AchievementDefaults {
  title?: string;
  level?: string;
  year?: number;
  recipient?: string;
  description?: string;
  published?: boolean;
}

export const AchievementForm: React.FC<{ action: Action; levels: string[]; defaults?: AchievementDefaults }> = ({ action, levels, defaults = {} }) => (
  <ActionForm action={action} aria-label="Formulir prestasi">
    <FieldGroup title="Data prestasi">
      <TextField name="title" label="Nama prestasi" defaultValue={defaults.title} maxLength={200} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField name="level" label="Tingkat" defaultValue={defaults.level ?? levels[0]} options={toOptions(levels)} required />
        <TextField name="year" label="Tahun" type="number" min={1961} defaultValue={defaults.year ?? new Date().getFullYear()} required />
      </div>
      <TextField name="recipient" label="Penerima" defaultValue={defaults.recipient} hint="Nama gudep atau tim. Hindari nama lengkap anak di bawah umur." required />
      <TextAreaField name="description" label="Keterangan" rows={3} maxLength={1000} defaultValue={defaults.description} />
      <CheckboxField name="published" label="Tayangkan di halaman Prestasi" defaultChecked={defaults.published ?? true} />
    </FieldGroup>
    <SaveButton />
  </ActionForm>
);
