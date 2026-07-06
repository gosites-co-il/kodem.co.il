'use client';

import { useMemo } from 'react';
import { pickRandomSubtitle } from '../../lib/auth/subtitles';
import { m } from '../../lib/auth/motion-provider';
import { fadeUp, usePrefersReducedMotion } from '../../lib/auth/motion';

export function DynamicSubtitle() {
  const subtitle = useMemo(() => pickRandomSubtitle(), []);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <m.p
      className="text-lg text-muted-foreground"
      aria-live="polite"
      initial={prefersReducedMotion ? false : fadeUp.hidden}
      animate={prefersReducedMotion ? undefined : fadeUp.visible}
      transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
    >
      {subtitle}
    </m.p>
  );
}
