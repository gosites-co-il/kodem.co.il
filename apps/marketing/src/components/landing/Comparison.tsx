import { Check, Minus } from 'lucide-react';

const ROWS = [
  { feature: 'AI מלא כלול במחיר', kodem: true, others: 'תוספת בתשלום' },
  { feature: 'לידים ללא הגבלה', kodem: true, others: 'תמחור לפי כמות' },
  { feature: 'ניתוח משפך מכירות והמלצות', kodem: true, others: 'אין' },
  { feature: 'דשבורד ROAS מהפרסום ועד הסגירה', kodem: true, others: 'חלקי' },
  { feature: 'קביעת תורים אוטומטית מהשיחה', kodem: true, others: 'חלקי' },
  { feature: 'עברית מלאה, נבנה לישראל', kodem: true, others: 'חלקי' },
] as const;

export function Comparison() {
  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold leading-tight sm:text-4xl">
          בדקנו את כל הכלים בשוק. בגלל זה בנינו את KODEM.
        </h2>

        {/* Desktop table */}
        <div className="mt-10 hidden overflow-hidden rounded-2xl border border-border shadow-card md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="p-4 text-start font-semibold">
                  יכולת
                </th>
                <th
                  scope="col"
                  className="bg-brand/10 p-4 text-center font-semibold text-brand"
                >
                  KODEM
                </th>
                <th scope="col" className="p-4 text-center font-semibold text-muted-foreground">
                  כלים אחרים
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <th scope="row" className="p-4 text-start font-medium">
                    {row.feature}
                  </th>
                  <td className="bg-brand/5 p-4 text-center">
                    <span className="inline-flex items-center justify-center gap-1 font-semibold text-brand">
                      <Check className="size-4" aria-hidden />
                      כן
                    </span>
                  </td>
                  <td className="p-4 text-center text-muted-foreground">{row.others}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="mt-8 space-y-4 md:hidden">
          {ROWS.map((row) => (
            <article
              key={row.feature}
              className="rounded-xl border border-border bg-card p-4 shadow-card"
            >
              <h3 className="font-semibold">{row.feature}</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-brand/10 p-3">
                  <dt className="text-xs text-brand">KODEM</dt>
                  <dd className="mt-1 flex items-center gap-1 font-semibold text-brand">
                    <Check className="size-4" aria-hidden />
                    כן
                  </dd>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <dt className="text-xs text-muted-foreground">כלים אחרים</dt>
                  <dd className="mt-1 flex items-center gap-1 text-muted-foreground">
                    <Minus className="size-4" aria-hidden />
                    {row.others}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
