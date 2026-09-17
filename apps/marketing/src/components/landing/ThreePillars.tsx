const PILLARS = [
  {
    title: 'לוכדים הכל',
    body: 'פייסבוק, אינסטגרם, וואטסאפ, דף נחיתה, טופס באתר, אקסל ישן. כל ליד מכל מקור נכנס למערכת תוך 3 שניות, מקבל תיוג ונכנס לתהליך. אף אחד לא נופל בין הכיסאות. לעולם.',
  },
  {
    title: 'סוגרים יותר',
    body: 'ה-AI לא סתם עונה. הוא שואל את השאלות הנכונות, מזהה מי חם ומי סתם בודק, קובע פגישות לבד ביומן, ועושה פולו-אפ עד שיש תשובה ברורה. כשליד מתחמם, אתה מקבל התראה: תיכנס לסגור.',
  },
  {
    title: 'צומחים חכם',
    body: 'דשבורד אחד שמראה כמה כל שקל פרסום החזיר, איפה עסקאות נופלות בדרך, ומה לתקן השבוע. לא עוד "נראה לי שהקמפיין עובד". מספרים. ופעם בשבוע, המלצה אחת ברורה לשיפור.',
  },
] as const;

export function ThreePillars() {
  return (
    <section id="pillars" className="section-pad bg-muted/40">
      <div className="container-site">
        <h2 className="reveal mx-auto max-w-3xl text-center text-3xl font-extrabold leading-tight sm:text-4xl">
          מערכת אחת. שלוש עבודות שאף עובד לא יכול לעשות לבד.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PILLARS.map((card) => (
            <article key={card.title} className="bento-card reveal flex flex-col">
              <div
                className="mb-5 flex aspect-[16/10] items-center justify-center rounded-2xl border border-dashed border-border bg-[linear-gradient(145deg,hsl(210_40%_96%),hsl(199_89%_48%/0.08))] text-center text-xs text-muted-foreground"
                role="img"
                aria-label={`מקום שמור לצילום מסך מוצר — ${card.title}`}
              >
                מקום שמור לצילום מסך מוצר
              </div>
              <h3 className="text-xl font-bold">{card.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
