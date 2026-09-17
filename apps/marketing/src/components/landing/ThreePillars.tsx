import { Inbox, Bot, LineChart } from 'lucide-react';

const PILLARS = [
  {
    icon: Inbox,
    title: 'לוכדים הכל',
    body: 'פייסבוק, אינסטגרם, וואטסאפ, דף נחיתה, טפסים ואקסל — כל ליד נכנס תוך שניות, מתויג, ונכנס לתהליך. בלי נפילות בין כלים.',
    accent: 'bg-primary',
  },
  {
    icon: Bot,
    title: 'סוגרים יותר',
    body: 'AI בעברית ששואל, מקשיב, מתאם תורים ועושה פולו־אפ. כשהליד חם — אתה נכנס לסגירה, לא לציד.',
    accent: 'bg-[hsl(var(--trust))]',
  },
  {
    icon: LineChart,
    title: 'צומחים חכם',
    body: 'דשבורד אחד: כמה החזיר כל שקל פרסום, איפה המשפך נשבר, ומה לתקן השבוע — תיקון אחד ברור.',
    accent: 'bg-[hsl(var(--spark))]',
  },
] as const;

export function ThreePillars() {
  return (
    <section id="pillars" className="section-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,hsl(187_62%_66%/0.12),transparent_50%)]"
        aria-hidden
      />
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            מערכת אחת. שלוש עבודות שאף עובד לא מחזיק לבד.
          </h2>
          <p className="prose-site mx-auto mt-4">
            לא עוד קפיצה בין בוט, CRM וטבלאות. ליד שנכנס — נענה, נמדד, ומקדם עסקה.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PILLARS.map((card, i) => (
            <article
              key={card.title}
              className="group relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-soft sm:p-8"
            >
              <div
                className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent} text-white shadow-soft`}
              >
                <card.icon className="size-5" aria-hidden />
              </div>
              <p className="text-xs font-bold tracking-wide text-muted-foreground">
                שלב {i + 1}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {card.body}
              </p>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-start scale-x-0 bg-primary transition duration-500 group-hover:scale-x-100"
                aria-hidden
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
