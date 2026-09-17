const STEPS = [
  {
    n: '01',
    title: 'מגדירים',
    body: 'נרשמים, מחברים וואטסאפ ופייסבוק, מספרים למערכת על העסק. ליווי מלא שלנו בהקמה.',
  },
  {
    n: '02',
    title: 'המערכת לומדת',
    body: 'ה-AI מקבל את השאלות, המחירים והטון שלך. אתה מאשר איך הוא עונה לפני שהוא פוגש לקוח ראשון.',
  },
  {
    n: '03',
    title: 'אתה סוגר',
    body: 'מהרגע הזה כל ליד נענה תוך שניות. אתה נכנס רק לסגירות ולפגישות שכבר נקבעו לך ביומן.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold leading-tight sm:text-4xl">
          מהרשמה ללידים שנענים לבד: 30 דקות.
        </h2>

        <ol className="mt-12 flex flex-col gap-8 md:flex-row md:gap-6">
          {STEPS.map((step, i) => (
            <li
              key={step.n}
              className="relative flex flex-1 flex-col rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              {i < STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute start-1/2 top-full z-0 hidden h-8 w-px -translate-x-1/2 bg-border md:start-full md:top-1/2 md:h-px md:w-6 md:translate-x-0 md:-translate-y-1/2"
                  aria-hidden
                />
              ) : null}
              <span className="text-sm font-bold text-brand">{step.n}</span>
              <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
