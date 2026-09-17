import { MessageSquare, CalendarClock, LineChart, Inbox, Bot, Zap } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { PageHero } from '../site/PageHero';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';

const FEATURES = [
  {
    icon: Inbox,
    title: 'ליכוד לידים מכל מקור',
    body: 'פייסבוק, אינסטגרם, וואטסאפ, דף נחיתה, טפסים ואקסל — הכל נכנס תוך שניות עם תיוג אוטומטי.',
    span: 'md:col-span-2',
  },
  {
    icon: Bot,
    title: 'AI שמוכר בעברית',
    body: 'שואל, מקשיב, מתאים טון, ומעביר אליך ברגע שהלקוח מבקש אדם.',
    span: '',
  },
  {
    icon: MessageSquare,
    title: 'וואטסאפ רשמי',
    body: 'Meta API, תבניות מאושרות ומנגנון הסרה — בלי סיכון לחשבון.',
    span: '',
  },
  {
    icon: CalendarClock,
    title: 'תורים אוטומטיים',
    body: 'השיחה קובעת פגישה ביומן. אתה מגיע לסגירות שכבר מחכות.',
    span: '',
  },
  {
    icon: LineChart,
    title: 'ROAS מקצה לקצה',
    body: 'מהקליק ועד העסקה — כמה החזיר כל שקל פרסום, ואיפה המשפך נשבר.',
    span: 'md:col-span-2',
  },
  {
    icon: Zap,
    title: 'המלצה שבועית',
    body: 'לא עוד “נראה לי”. פעם בשבוע — תיקון אחד ברור לשיפור.',
    span: '',
  },
] as const;

export function ProductPage() {
  return (
    <>
      <PageHero
        eyebrow="המוצר"
        title={'מערכת אחת.\nמהליד הראשון ועד הסגירה.'}
        description="KODEM מחברת ליכוד לידים, שיחת מכירה בוואטסאפ, תורים ואנליטיקס — בלי לגלוש בין חמישה כלים."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
          >
            <a href="/#loss-calculator">{PRIMARY_CTA_LABEL}</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 cursor-pointer rounded-full"
          >
            <a href="/how-it-works">איך ההקמה עובדת</a>
          </Button>
        </div>
      </PageHero>

      <section className="section-pad">
        <div className="container-site">
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className={`bento-card reveal ${f.span}`}>
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--surface-dark))] text-white shadow-soft">
                  <f.icon className="size-5" aria-hidden />
                </div>
                <h2 className="text-xl font-bold">{f.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {f.body}
                </p>
                <div className="pointer-events-none absolute -start-8 -top-8 h-32 w-32 rounded-full bg-cta/5 blur-2xl" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad landing-gradient-dark text-[hsl(var(--surface-dark-fg))]">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal">
            <p className="eyebrow border-white/15 bg-white/10 text-white/80">למה זה מרגיש אחרת</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              לא בוט של תפריטים.
              <br />
              שיחת מכירה אמיתית.
            </h2>
            <p className="mt-4 text-white/70 leading-relaxed">
              הלקוחות מקבלים שאלות רלוונטיות, פולו־אפ חכם, והעברה חלקה אלייך כשצריך.
              אתה רואה את כל השיחה ב־CRM — בלי לאבד הקשר.
            </p>
          </div>
          <div className="bento-card-dark reveal">
            <ul className="space-y-4 text-sm sm:text-base">
              {[
                'זיהוי ליד חם מול “רק בודק”',
                'פולו־אפ עד שיש תשובה ברורה',
                'התראה כשצריך שתיכנס לסגור',
                'תיעוד מלא במשפך המכירות',
              ].map((item) => (
                <li key={item} className="flex gap-3 border-b border-white/10 pb-4 last:border-0">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cta" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
