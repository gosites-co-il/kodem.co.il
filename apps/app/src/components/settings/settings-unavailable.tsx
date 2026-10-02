export function SettingsUnavailable({ title }: { title: string }) {
  return (
    <section className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        האזור הזה עדיין לא זמין.
      </p>
    </section>
  );
}
