import { EntryGate } from '../../components/entry/entry-gate';

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EntryGate>{children}</EntryGate>;
}
