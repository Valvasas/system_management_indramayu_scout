import React from 'react';

export const SkipToContent: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:inline-flex focus:min-h-touch focus:items-center focus:rounded-md focus:border focus:border-action-primary focus:bg-surface-base focus:px-4 focus:font-medium focus:text-text-accent focus:shadow-md"
  >
    Lanjut ke konten utama
  </a>
);
