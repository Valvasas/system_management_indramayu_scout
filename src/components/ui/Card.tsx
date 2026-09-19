import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  /** Render sebagai elemen semantik lain, mis. <article> untuk kartu berita. */
  as?: 'div' | 'article' | 'li' | 'section';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, as = 'div', children, ...props }, ref) => {
    // `as` hanya mengganti tag; atribut yang diterima tetap atribut elemen blok.
    const Tag = as as React.ElementType;
    return (
      <Tag
        ref={ref}
        className={cn(
          'bg-surface-base rounded-lg border border-border-subtle overflow-hidden',
          hoverable && 'transition-shadow hover:shadow-md',
          className,
        )}
        {...props}
      >
        {children}
      </Tag>
    );
  },
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-4 sm:px-6 py-4 border-b border-border-subtle', className)} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-4 sm:p-6', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('px-4 sm:px-6 py-4 bg-surface-subtle border-t border-border-subtle', className)}
    {...props}
  >
    {children}
  </div>
);

export { Card };
