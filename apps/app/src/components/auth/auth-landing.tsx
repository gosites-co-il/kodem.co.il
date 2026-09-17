'use client';

import Link from 'next/link';
import { Button } from '@kodem/design-system/components/ui/button';
import { MotionProvider, m } from '../../lib/auth/motion-provider';
import { fadeUp, usePrefersReducedMotion } from '../../lib/auth/motion';
import { ROUTES } from '../../lib/constants';
import { AuthSplitFrame } from './auth-split-frame';
import { authFieldClasses } from './auth-shell';
import { OAuthButton } from './oauth-button';

function AuthLandingContent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <AuthSplitFrame>
      <div className="flex flex-col gap-6">
        <m.div
          className="flex flex-col items-center gap-2 text-center"
          initial={prefersReducedMotion ? false : fadeUp.hidden}
          animate={prefersReducedMotion ? undefined : fadeUp.visible}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1 className="text-2xl font-bold tracking-tight">ברוכים הבאים</h1>
          <p className="text-balance text-sm text-muted-foreground">
            התחילו עם Google או המשיכו עם אימייל
          </p>
        </m.div>

        <m.div
          className="grid gap-4"
          initial={prefersReducedMotion ? false : fadeUp.hidden}
          animate={prefersReducedMotion ? undefined : fadeUp.visible}
          transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}
        >
          <OAuthButton
            provider="google"
            label="המשך עם Google"
            className={authFieldClasses.buttonOutline}
          />

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t after:border-border">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">
              או
            </span>
          </div>

          <Button
            className={authFieldClasses.button}
            asChild
          >
            <Link href={ROUTES.loginEmail}>המשך עם אימייל</Link>
          </Button>
        </m.div>

        <p className="px-2 text-center text-xs text-muted-foreground">
          בהמשך אתם מאשרים את{' '}
          <Link
            href={ROUTES.terms}
            className="underline underline-offset-4 hover:text-foreground"
          >
            תנאי השימוש
          </Link>{' '}
          ואת{' '}
          <Link
            href={ROUTES.privacy}
            className="underline underline-offset-4 hover:text-foreground"
          >
            מדיניות הפרטיות
          </Link>
          .
        </p>

        <p className="text-center text-sm text-muted-foreground">
          אין לכם חשבון?{' '}
          <Link
            href={ROUTES.register}
            className="underline underline-offset-4 hover:text-foreground"
          >
            הירשמו
          </Link>
        </p>
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
