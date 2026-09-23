import { Suspense } from 'react';
import { EntryGate } from '../../components/entry/entry-gate';
import { LegalConsentGate } from '../../components/legal/legal-consent-gate';

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">טוען…</p>
        </div>
      }
    >
      <EntryGate>
        <LegalConsentGate>{children}</LegalConsentGate>
      </EntryGate>
    </Suspense>
  );
}
