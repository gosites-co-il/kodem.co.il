'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import { api, isApiError } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { AppNavbar } from './app-navbar';

function ImpersonationBanner() {
  const router = useRouter();
  const { impersonating, workspace, setSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!impersonating || !workspace) return null;

  async function stop() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.adminStopImpersonation();
      setSession({
        user: result.user,
        workspace: result.workspace,
        role: result.role,
        token: result.accessToken ?? result.token,
        impersonating: false,
      });
      router.push(ROUTES.adminWorkspaces);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'היציאה מהסביבה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b bg-amber-500/15">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <p className="text-sm">
          פועלים בתוך הסביבה <span className="font-medium">{workspace.name}</span>
        </p>
        <div className="flex items-center gap-3">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void stop()}
          >
            {busy ? 'יוצאים…' : 'חזרה לניהול'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="app-surface min-h-screen">
      <AppNavbar />
      <ImpersonationBanner />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 text-start sm:px-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
