import React, { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors ' +
  'disabled:opacity-60 disabled:pointer-events-none aria-disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  // Kontras teks putih di atas action-primary (green-700) = 5.0:1 -> lolos AA.
  primary: 'bg-action-primary text-text-on-brand hover:bg-action-primary-hover active:bg-action-primary-active',
  secondary:
    'bg-action-secondary text-action-secondary-text border border-border-brand hover:bg-action-secondary-hover',
  outline: 'bg-surface-base text-text-primary border border-border-strong hover:bg-surface-subtle',
  ghost: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
  danger: 'bg-action-danger text-text-on-brand hover:bg-action-danger-hover',
  link: 'text-text-accent underline underline-offset-4 hover:text-action-primary-hover px-0',
};

// Setiap ukuran tetap >= 44px tinggi (WCAG 2.2 - 2.5.8 & standar internal proyek).
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-touch px-3 text-sm',
  md: 'min-h-touch px-4 text-sm sm:text-base',
  lg: 'min-h-touch h-12 px-6 text-base',
};

export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Teks yang dibacakan pembaca layar selagi isLoading. */
  loadingLabel?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingLabel = 'Memproses',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={buttonStyles(variant, size, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">{loadingLabel}</span>
        </>
      )}
      {children}
    </button>
  ),
);

Button.displayName = 'Button';

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Tautan bergaya tombol. Dipakai menggantikan pola `<Link tabIndex={-1}><Button/></Link>`
 * yang menyarangkan elemen interaktif di dalam elemen interaktif (pelanggaran a11y).
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ href, variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const isExternal = /^https?:\/\//i.test(href);
    const classes = buttonStyles(variant, size, className);

    if (isExternal) {
      return (
        <a ref={ref} href={href} className={classes} rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    }

    return (
      <Link ref={ref} href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  },
);

ButtonLink.displayName = 'ButtonLink';

export { Button };
