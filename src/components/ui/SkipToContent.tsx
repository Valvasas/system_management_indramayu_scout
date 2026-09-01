import React from 'react';

export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-green-700 focus:font-medium focus:rounded-md focus:shadow-md focus:ring-2 focus:ring-green-600 focus:outline-none transition-transform"
    >
      Lanjut ke konten utama
    </a>
  );
};
