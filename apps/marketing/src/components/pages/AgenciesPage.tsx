import { ArrowLeft } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kodem/design-system/components/ui/accordion';
import { PageHero } from '../site/PageHero';
import { DashboardDemo } from '../landing/DashboardDemo';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';
import { PRICING_PLANS } from '../../lib/pricing';
import {
  AGENCIES_FAQ,
  AGENCIES_GET,
  AGENCIES_PAINS,
} from '../../lib/agencies';

const PRO = PRICING_PLANS.find((p) => p.id === 'pro')!;

export function AgenciesPage() {
  return (
    <>
      <PageHero
        title={'לסוכנויות דיגיטל.\nפחות אקסלים. יותר סגירות ללקוחות.'}
        description="KODEM מחברת מענה ללידים, משפך מכירות ודיווח מהפרסום עד הקופה — כדי שתוכלו להוכיח ערך בלי לבנות מערכת נפרדת לכל לקוח."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
          >
            <a href="/pricing">למחירון Pro</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 cursor-pointer rounded-full"
          >
            <a href="/contact">שיחת התאמה לסוכנות</a>
          </Button>
        </div>
      </PageHero>

      <section className="section-pad pt-0">
        <div className="container-site">
          <h2 className="reveal mx-auto max-w-2xl text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            הכאב שמוכר לסוכנויות
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {AGENCIES_PAINS.map((item) => (
              <article key={item.title} className="bento-card reveal">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/40">
        <div className="container-site">
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              מה מקבלים בפועל
            </h2>
            <p className="prose-site mx-auto mt-4">
              לא עוד כלי צ׳אט בצד. מערכת אחת שמריצה מענה, משפך ודיווח — ומתאימה
              לסוכנויות שמנהלות נפח גבוה.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {AGENCIES_GET.map((item) => (
              <article key={item.title} className="bento-card reveal">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="reveal">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              דיווח ללקוחות: מהפרסום עד הקופה
            </h2>
            <p className="prose-site mt-4 max-w-xl">
              במקום מצגת שבועית מאקסלים — מסך שמחבר הוצאה, לידים, פגישות וסגירות.
              הלקוח רואה תוצאה; אתם שומרים אמון.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-6 h-11 cursor-pointer rounded-full"
            >
              <a href="/product#dashboard" className="inline-flex items-center gap-2">
                לפירוט במוצר
                <ArrowLeft className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
          <div className="reveal mx-auto w-full max-w-md lg:max-w-none">
            <DashboardDemo compact />
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/35">
        <div className="container-site">
          <div className="bento-card reveal mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              {PRO.name} — {PRO.tagline}
            </h2>
            <p className="prose-site mx-auto mt-4 max-w-xl">
              ₪{PRO.priceIls.toLocaleString('he-IL')} / חודש. כולל בין השאר{' '}
              {PRO.features.filter((f) => f.includes('White Label') || f.includes('אימון')).join(' · ')}.
            </p>
            <ul className="mx-auto mt-6 max-w-md space-y-2 text-start text-sm text-muted-foreground">
              {PRO.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cta" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                className="h-11 cursor-pointer rounded-full bg-cta text-cta-foreground hover:bg-cta/90"
              >
                <a href="/pricing">{PRO.cta}</a>
              </Button>
              <Button asChild variant="outline" className="h-11 cursor-pointer rounded-full">
                <a href="/contact">דברו איתנו על סוכנות</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="container-site mx-auto max-w-3xl">
          <h2 className="reveal text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
            שאלות נפוצות לסוכנויות
          </h2>
          <Accordion type="single" collapsible className="reveal mt-10 w-full">
            {AGENCIES_FAQ.map((item, i) => (
              <AccordionItem key={item.q} value={`agency-${i}`}>
                <AccordionTrigger className="cursor-pointer text-start text-base hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="container-site">
          <div className="landing-gradient-signal reveal relative overflow-hidden rounded-2xl px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              רוצים לבדוק התאמה לסוכנות?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/85">
              שיחת היכרות קצרה — או מחשבון שמבהיר כמה לידים נעלמים היום אצל הלקוחות
              שלכם.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 cursor-pointer rounded-full border border-primary-foreground/25 bg-[hsl(var(--surface-dark))] px-8 text-[hsl(var(--surface-dark-fg))] hover:bg-[hsl(var(--surface-mid))]"
              >
                <a href="/#loss-calculator">{PRIMARY_CTA_LABEL}</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 cursor-pointer rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-white/10"
              >
                <a href="/contact">צור קשר</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
