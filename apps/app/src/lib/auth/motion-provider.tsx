'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';

export { m, LazyMotion, domAnimation };

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
