'use client';

import { m } from '../../lib/auth/motion-provider';
import { fadeUp, usePrefersReducedMotion } from '../../lib/auth/motion';
import { OAuthButton, type OAuthProvider } from './oauth-button';

const providers: OAuthProvider[] = ['google', 'github', 'facebook'];

export function OAuthButtons() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="grid gap-2.5">
      {providers.map((provider, index) => (
        <m.div
          key={provider}
          initial={prefersReducedMotion ? false : fadeUp.hidden}
          animate={prefersReducedMotion ? undefined : fadeUp.visible}
          transition={{
            duration: 0.4,
            delay: 0.25 + index * 0.08,
            ease: 'easeOut',
          }}
        >
          <OAuthButton provider={provider} />
        </m.div>
      ))}
    </div>
  );
}
