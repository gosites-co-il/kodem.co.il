const STATS = [
  {
    value: '100%',
    label: 'מהלידים מקבלים מענה. ממוצע הענף: 52%.',
  },
  {
    value: '3 שניות',
    label: 'זמן מענה לליד חדש. הממוצע בעסק ישראלי: 47 דקות.',
  },
  {
    value: 'פי 3.5',
    label: 'יותר סגירות לליד שנענה תוך 5 דקות.',
  },
] as const;

export function SocialProof() {
  return (
    <section aria-label="נתוני אמון" className="relative border-y border-border/70">
      <div className="container-site grid gap-8 py-12 md:grid-cols-3 md:gap-6 md:py-14">
        {STATS.map((stat) => (
          <div key={stat.value} className="reveal text-center md:text-start">
            <p className="text-gradient-brand text-4xl font-extrabold tracking-tight sm:text-5xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
