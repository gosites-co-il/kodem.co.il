import {
  MessageSquare,
  CalendarClock,
  Inbox,
  Bot,
  Zap,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { PageHero } from '../site/PageHero';
import { DashboardDemo } from '../landing/DashboardDemo';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';
import { PRODUCT_MODULES, modulePath } from '../../lib/modules';

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
    icon: Zap,
    title: 'המלצה שבועית',
    body: 'לא עוד “נראה לי”. פעם בשבוע — תיקון אחד ברור לשיפור.',
    span: 'md:col-span-2',
  },
] as const;

export function ProductPage() {
  return (
    <>
      <PageHero
        title={'מערכת אחת.\nמהליד הראשון ועד הסגירה.'}
        description="KODEM מחברת CRM, אוטומציות ואינטגרציות עם שיחת מכירה בוואטסאפ — בלי לגלוש בין חמישה כלים."
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
            <a href="#modules">למודולים</a>
          </Button>
        </div>
      </PageHero>

      <section id="dashboard" className="section-pad pt-0">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="reveal">
            <p className="font-data text-xs font-bold tracking-wide text-[hsl(var(--trust))]">
              01 · לוח בקרה
            </p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              לוח בקרה 24/7 — מהפרסום עד הקופה
            </h2>
            <p className="prose-site mt-4 max-w-xl">
              ROAS מקצה לקצה: מהקליק ועד העסקה. כמה החזיר כל שקל פרסום, איפה המשפך
              נשבר, ומה לתקן השבוע — בלי לנחש.
            </p>
          </div>
          <div className="reveal mx-auto w-full max-w-md lg:max-w-none">
            <DashboardDemo />
          </div>
        </div>
      </section>

      <section className="section-pad pt-0">
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

      <section id="modules" className="section-pad bg-muted/40">
        <div className="container-site">
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              שלושה עמודי תווך. חוויה אחת.
            </h2>
            <p className="prose-site mx-auto mt-4">
              המודולים קיימים למבנה — לא לפיצול. ליד, שיחה, משימה ואינטגרציה חיים באותו זרימה.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PRODUCT_MODULES.map((mod) => (
              <a
                key={mod.id}
                href={modulePath(mod.id)}
                className="bento-card reveal group flex cursor-pointer flex-col transition hover:border-cta/30"
              >
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--surface-dark))] text-white shadow-soft">
                  <mod.icon className="size-5" aria-hidden />
                </div>
                <h3 className="text-xl font-bold group-hover:text-cta">{mod.teaserTitle}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {mod.teaserBody}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                  לעמוד המודול
                  <ArrowLeft
                    className="size-4 transition group-hover:-translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad landing-gradient-dark text-[hsl(var(--surface-dark-fg))]">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div className="reveal">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
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

      <section className="section-pad">
        <div className="container-site">
          <div className="bento-card reveal mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">רוצה לראות את זה על המספרים שלך?</h2>
            <p className="prose-site mx-auto mt-4 max-w-xl">
              חשב כמה לידים נעלמים היום — ואז נחבר את ה־CRM, האוטומציות והאינטגרציות לעסק שלך.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="h-11 cursor-pointer rounded-full bg-cta text-cta-foreground hover:bg-cta/90"
              >
                <a href="/#loss-calculator">{PRIMARY_CTA_LABEL}</a>
              </Button>
              <Button asChild variant="outline" className="h-11 cursor-pointer rounded-full">
                <a href="/how-it-works">איך ההקמה עובדת</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
