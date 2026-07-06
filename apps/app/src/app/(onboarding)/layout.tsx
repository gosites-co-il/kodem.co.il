import { EntryGate } from '../../components/entry/entry-gate';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EntryGate>{children}</EntryGate>;
}
