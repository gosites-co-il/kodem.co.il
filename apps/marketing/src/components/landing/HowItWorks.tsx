const STEPS = [
  {
    title: 'מגדירים יחד',
    body: 'מחברים וואטסאפ ופייסבוק, מספרים למערכת על העסק — עם ליווי הקמה צמוד.',
  },
  {
    title: 'המערכת לומדת',
    body: 'ה-AI מקבל שאלות, מחירים וטון. אתה מאשר איך הוא עונה לפני ליד ראשון.',
  },
  {
    title: 'אתה סוגר',
    body: 'כל ליד נענה תוך שניות. אתה נכנס לפגישות ולסגירות שכבר מחכות ביומן.',
  },
] as const;

export function HowItWorks() {
  return (
    <section className="section-pad">
      <div className="container-site">
        <h2 className="mx-auto max-w-3xl text-center text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          מהרשמה ללידים שנענים לבד — כ־30 דקות.
        </h2>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:border-[hsl(var(--glow))]/40 sm:p-8"
            >
              {i < STEPS.length - 1 ? (
                <span
                  className="pointer-events-none absolute -end-3 top-1/2 z-10 hidden h-px w-6 -translate-y-1/2 bg-[hsl(var(--glow))]/50 md:block"
                  aria-hidden
                />
              ) : null}
              <span className="font-data flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-xl font-bold tracking-tight">{step.title}</h3>
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
