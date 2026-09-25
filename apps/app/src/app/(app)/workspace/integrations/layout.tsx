import { IntegrationsNav } from '../../../../components/integrations/integrations-nav';

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">אינטגרציות</h1>
        <p className="text-sm text-muted-foreground">
          חיבורים לספקים חיצוניים וערוצי תקשורת מול לקוחות
        </p>
      </div>
      <IntegrationsNav />
      {children}
    </div>
  );
}
