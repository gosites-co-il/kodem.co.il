'use client';

import Link from 'next/link';
import { Button } from '@kodem/design-system/components/ui/button';
import { ROUTES } from '../../lib/constants';
import { m } from '../../lib/auth/motion-provider';
import { fadeUp, usePrefersReducedMotion } from '../../lib/auth/motion';

export function EmailContinueButton() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <m.div
      initial={prefersReducedMotion ? false : fadeUp.hidden}
      animate={prefersReducedMotion ? undefined : fadeUp.visible}
      transition={{ duration: 0.4, delay: 0.5, ease: 'easeOut' }}
    >
      <Button
        variant="ghost"
        className="w-full text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href={ROUTES.loginEmail}>המשך עם אימייל</Link>
      </Button>
    </m.div>
  );
}
