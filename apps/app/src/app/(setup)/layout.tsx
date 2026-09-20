import { EntryGate } from '../../components/entry/entry-gate';
import { LegalConsentGate } from '../../components/legal/legal-consent-gate';

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EntryGate>
      <LegalConsentGate>{children}</LegalConsentGate>
    </EntryGate>
  );
}
