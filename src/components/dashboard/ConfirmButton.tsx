'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { Button, type ButtonVariant } from '@/components/ui/Button';

const Inner: React.FC<{ children: React.ReactNode; variant: ButtonVariant; size: 'sm' | 'md'; label?: string }> = ({
  children,
  variant,
  size,
  label,
}) => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} isLoading={pending} aria-label={label}>
      {children}
    </Button>
  );
};

/**
 * Tombol aksi satu klik (hapus, tandai dibaca, jadikan sampul) yang menjalankan Server Action.
 * `confirm` → minta konfirmasi dulu; dipakai untuk aksi yang tidak dapat dibatalkan.
 */
export const ActionButton: React.FC<{
  action: () => Promise<void>;
  children: React.ReactNode;
  confirm?: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  label?: string;
}> = ({ action, children, confirm, variant = 'outline', size = 'sm', label }) => (
  <form
    action={action}
    onSubmit={(e) => {
      if (confirm && !window.confirm(confirm)) e.preventDefault();
    }}
  >
    <Inner variant={variant} size={size} label={label}>
      {children}
    </Inner>
  </form>
);
