import React, { AnchorHTMLAttributes, ButtonHTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger' | 'link' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Bentuk pil: ramah sentuh dan terasa santai, cocok untuk nuansa outdoor.
const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-pill transition-[background-color,color,border-color,box-shadow,transform] duration-200 ' +
  'active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none aria-disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  // Putih di atas action-primary (forest-600) = 7.9:1.
  primary: 'bg-action-primary text-text-on-brand shadow-sm hover:bg-action-primary-hover hover:shadow-md active:bg-action-primary-active',
  secondary: 'bg-action-secondary text-action-secondary-text border border-border-brand hover:bg-action-secondary-hover',
  outline: 'bg-surface-base text-text-primary border border-border-strong hover:border-text-primary hover:bg-surface-subtle',
  ghost: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary',
  // Ember (api unggun): ajakan hangat yang menonjol. Putih di atas ember-700 = 6.2:1.
  accent: 'bg-action-accent text-text-on-brand shadow-sm hover:bg-action-accent-hover hover:shadow-md',
  danger: 'bg-action-danger text-text-on-brand hover:bg-action-danger-hover',
  link: 'text-text-accent underline underline-offset-4 hover:text-action-primary-hover px-0 rounded-md',
  // Di atas pita hutan gelap: latar putih, teks hijau tua.
  inverse: 'bg-surface-base text-action-secondary-text hover:bg-action-secondary shadow-sm',
};

// Setiap ukuran tetap >= 44px tinggi (WCAG 2.2 - 2.5.8 & standar internal proyek).
const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-touch px-4 text-sm',
  md: 'min-h-touch px-5 text-sm sm:text-base',
  lg: 'min-h-touch h-12 px-7 text-base',
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
