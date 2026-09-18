import { SettingsNav } from '../../../../components/settings/settings-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">הגדרות סביבה</h1>
        <p className="text-sm text-muted-foreground">
          ניהול סביבת העבודה, חיבורים וערוצי תקשורת
        </p>
      </div>
      <SettingsNav />
      {children}
    </div>
  );
}
