'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PendingLegalDocument } from '@kodem/contracts';
import { LegalReconsentDialog } from '@kodem/design-system/components/ui/legal-reconsent-dialog';
import { api, isApiError } from '../../lib/api';
import { marketingLegalHref } from '../../lib/marketing-origin';
import { useAuth } from '../../providers/auth-provider';

/**
 * Foundation for legal re-consent / missing signup consent.
 * Only opens when the backend returns pending documents
 * (requiresReconsent or post-enforcement signup without records).
 */
export function LegalConsentGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [pending, setPending] = useState<PendingLegalDocument[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setPending([]);
      return;
    }
    try {
      const status = await api.getLegalStatus();
      setPending(status.pending);
      setError(null);
    } catch (err) {
      if (isApiError(err) && err.status === 401) {
        setPending([]);
        return;
      }
      // Don't block the app on transient legal status failures.
      setPending([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    void refresh();
  }, [isLoading, refresh]);

  const current = pending[0] ?? null;

  async function handleConfirm() {
    if (!current || pending.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const source =
        pending.some((item) => item.reason === 'signup')
          ? 'OAUTH_SIGNUP'
          : 'RECONSENT';
      const result = await api.acceptLegalConsent({
        consents: pending.map((item) => ({
          document: item.code,
          version: item.version,
        })),
        source,
      });
      setPending(result.status.pending);
    } catch (err) {
      setError(
        isApiError(err) ? err.message : 'לא ניתן לשמור את ההסכמה. נסו שוב.',
      );
    } finally {
      setBusy(false);
    }
  }

  const documentHref =
    current == null
      ? '#'
      : current.route.startsWith('http')
        ? current.route
        : marketingLegalHref(
            current.route as '/terms' | '/privacy' | '/cookies' | '/ai-terms',
          );

  return (
    <>
      {children}
      <LegalReconsentDialog
        open={Boolean(current)}
        title={current?.title ?? ''}
        version={current?.version ?? ''}
        summary={
          error
            ? error
            : (current?.summary ??
              'יש לאשר את המסמך המשפטי המעודכן כדי להמשיך.')
        }
        documentHref={documentHref}
        onConfirm={handleConfirm}
        busy={busy}
      />
    </>
  );
}
