'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { MotionProvider, m } from '../../lib/auth/motion-provider';
import { fadeUp, scaleIn, usePrefersReducedMotion } from '../../lib/auth/motion';
import { ROUTES } from '../../lib/constants';
import { AuthSplitFrame } from './auth-split-frame';
import { OAuthButton } from './oauth-button';

function AuthLandingContent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <AuthSplitFrame>
      <div className="mx-auto w-full max-w-md space-y-8">
        <m.div
          className="space-y-5"
          initial={prefersReducedMotion ? false : fadeUp.hidden}
          animate={prefersReducedMotion ? undefined : fadeUp.visible}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Link
            href={ROUTES.login}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            מערכת ההפעלה של העסק
            <ChevronLeft className="size-3.5 opacity-60" aria-hidden />
          </Link>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Kodem
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              קודם מבינים את העסק — ואז הכול מסתדר. CRM, ידע, תובנות ו-AI
              במקום אחד.
            </p>
          </div>
        </m.div>

        <m.div
          className="space-y-3"
          initial={prefersReducedMotion ? false : fadeUp.hidden}
          animate={prefersReducedMotion ? undefined : fadeUp.visible}
          transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
        >
          <OAuthButton
            provider="google"
            label="הירשמו עם Google"
            className="h-12 rounded-xl border-transparent bg-foreground text-background shadow-none hover:bg-foreground/90 hover:text-background hover:shadow-none"
          />
          <Button
            variant="outline"
            className="h-12 w-full rounded-xl border-border/80 bg-card shadow-none hover:bg-muted/50"
            asChild
          >
            <Link href={ROUTES.loginEmail}>הירשמו עם אימייל</Link>
          </Button>
        </m.div>

        <m.p
          className="text-center text-sm text-muted-foreground"
          initial={prefersReducedMotion ? false : scaleIn.hidden}
          animate={prefersReducedMotion ? undefined : scaleIn.visible}
          transition={{ duration: 0.4, delay: 0.22, ease: 'easeOut' }}
        >
          אין צורך בכרטיס אשראי
        </m.p>
      </div>
    </AuthSplitFrame>
  );
}

export function AuthLanding() {
  return (
    <MotionProvider>
      <AuthLandingContent />
    </MotionProvider>
  );
}
