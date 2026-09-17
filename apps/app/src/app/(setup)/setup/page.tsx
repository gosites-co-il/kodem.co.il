'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveSetupStepId } from '@kodem/contracts';
import { api } from '../../../lib/api';
import { setupHrefForState, setupStepHref } from '../../../lib/setup/routes';

/** `/setup` → redirect to the workspace's current step route. */
export default function SetupIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const state = await api.getSetup();
        if (cancelled) return;
        router.replace(
          setupHrefForState(resolveSetupStepId(state.step), state.setup),
        );
      } catch {
        if (cancelled) return;
        router.replace(setupStepHref('welcome'));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      טוען…
    </div>
  );
}
