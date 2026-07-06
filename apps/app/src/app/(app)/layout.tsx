import { EntryGate } from '../../components/entry/entry-gate';
import { AppShell } from '../../components/app/app-shell';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EntryGate>
      <AppShell>{children}</AppShell>
    </EntryGate>
  );
}
