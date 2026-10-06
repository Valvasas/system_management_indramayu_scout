import { z } from 'zod';
import { golonganEnum } from '@/db/schema';
import { ageOn } from '@/lib/domain';
import { checkbox, isoDate, optionalIsoDate, optionalText, phone, requiredText, uuid } from '@/lib/forms';

export const MemberSchema = z
  .object({
    fullName: requiredText('Nama lengkap', 120).pipe(z.string().min(3, 'Nama lengkap minimal 3 huruf.')),
    gender: z.enum(['L', 'P'], { errorMap: () => ({ message: 'Jenis kelamin wajib dipilih.' }) }),
    birthDate: isoDate('Tanggal lahir'),
    golongan: z.enum(golonganEnum.enumValues, { errorMap: () => ({ message: 'Golongan wajib dipilih.' }) }),
    gudepId: uuid('Gudep'),
    kta: optionalText(40),
    phone,
    address: optionalText(300),
    guardianName: optionalText(120),
    guardianPhone: phone,
    joinedAt: optionalIsoDate,
    notes: optionalText(1000),
    confirmDuplicate: checkbox,
  })
  .superRefine((v, ctx) => {
    const birth = new Date(v.birthDate);
    const now = new Date();
    if (Number.isNaN(birth.getTime()) || birth > now) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'Tanggal lahir tidak valid.' });
      return;
    }
    const age = ageOn(v.birthDate, now);
    if (age < 6 || age > 100) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'Usia di luar rentang anggota (6–100 tahun).' });
    }
    // UU PDP: data anak wajib disertai kontak orang tua/wali. Persetujuannya diberikan wali SENDIRI
    // lewat kode sekali pakai (features/consent) — bukan tanggal yang diketik staf.
    if (age < 18) {
      if (!v.guardianName) ctx.addIssue({ code: 'custom', path: ['guardianName'], message: 'Wajib untuk anggota di bawah 18 tahun.' });
      if (!v.guardianPhone) ctx.addIssue({ code: 'custom', path: ['guardianPhone'], message: 'Wajib untuk anggota di bawah 18 tahun.' });
    }
  });

export type MemberInput = z.infer<typeof MemberSchema>;
