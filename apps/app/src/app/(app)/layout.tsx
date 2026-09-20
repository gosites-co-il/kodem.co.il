import { EntryGate } from '../../components/entry/entry-gate';
import { LegalConsentGate } from '../../components/legal/legal-consent-gate';
import { AppShell } from '../../components/app/app-shell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EntryGate>
      <LegalConsentGate>
        <AppShell>{children}</AppShell>
      </LegalConsentGate>
    </EntryGate>
  );
}
