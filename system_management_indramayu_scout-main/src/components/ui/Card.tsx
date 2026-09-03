import React, { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, children, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-lg border border-gray-200 overflow-hidden';
    const hoverStyles = hoverable ? 'transition-shadow hover:shadow-md' : '';
    
    return (
      <div
        ref={ref}
        className={`${baseStyles} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-4 sm:px-6 py-4 border-b border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-4 sm:p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-100 ${className}`} {...props}>
    {children}
  </div>
);

export { Card };
