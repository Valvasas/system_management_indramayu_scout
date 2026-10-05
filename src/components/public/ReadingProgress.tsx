'use client';

import React, { useEffect, useState } from 'react';

/**
 * Bilah progres baca tipis di bawah header. Murni petunjuk visual (aria-hidden):
 * pembaca layar sudah tahu posisinya lewat struktur dokumen.
 */
export const ReadingProgress: React.FC<{ targetId: string }> = ({ targetId }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.6;
      setProgress(total <= 0 ? 1 : Math.min(1, Math.max(0, -rect.top / total)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetId]);

  return (
    <div aria-hidden="true" className="fixed inset-x-0 top-16 z-30 h-1 bg-transparent sm:top-[4.5rem]">
      <div className="h-full origin-left bg-action-accent" style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
};
