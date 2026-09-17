import { ArrowLeft } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kodem/design-system/components/ui/accordion';
import { PageHero } from '../site/PageHero';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';
import {
  MODULE_SECTION_ICONS,
  PRODUCT_MODULES,
  getModule,
  modulePath,
  type ModuleId,
} from '../../lib/modules';

type Props = {
  moduleId: ModuleId;
};

export function ModulePage({ moduleId }: Props) {
  const mod = getModule(moduleId);
  if (!mod) return null;

  const related = PRODUCT_MODULES.filter((m) => mod.related.includes(m.id));

  return (
    <>
      <PageHero
        eyebrow={mod.eyebrow}
        title={mod.heroTitle}
        description={mod.heroDescription}
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
            <a href="/product">כל היכולות</a>
          </Button>
        </div>
      </PageHero>

      <section className="section-pad pt-0">
        <div className="container-site">
          <div className="reveal mx-auto mb-10 max-w-3xl text-center">
            <p className="eyebrow mx-auto">למה זה כואב היום</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              הבעיה שהמודול הזה פותר.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {mod.pains.map((pain) => (
              <article key={pain.title} className="bento-card reveal">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--surface-dark))] text-white">
                  <MODULE_SECTION_ICONS.pain className="size-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold">{pain.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pain.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-muted/40">
        <div className="container-site">
          <div className="reveal max-w-3xl">
            <p className="eyebrow">יכולות</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">{mod.title}</h2>
            <p className="prose-site mt-4">{mod.description}</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {mod.capabilities.map((cap) => (
              <article key={cap.title} className="bento-card reveal">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--surface-dark))] text-white">
                  <cap.icon className="size-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold">{cap.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{cap.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad landing-gradient-dark text-[hsl(var(--surface-dark-fg))]">
        <div className="container-site">
          <div className="reveal max-w-3xl">
            <p className="eyebrow border-white/15 bg-white/10 text-white/80">תוצאה</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              מה משתנה אחרי שהמודול עובד.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {mod.outcomes.map((outcome) => (
              <article key={outcome.title} className="bento-card-dark reveal">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <MODULE_SECTION_ICONS.outcome className="size-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold">{outcome.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{outcome.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="eyebrow mx-auto">איך זה זורם</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              מאירוע ועד פעולה — בלי חורים.
            </h2>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mod.flow.map((step, i) => (
              <li key={step.title} className="bento-card reveal relative">
                <span className="text-xs font-bold text-cta">שלב {i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section-pad bg-muted/40">
        <div className="container-site max-w-3xl">
          <h2 className="reveal text-center text-3xl font-extrabold sm:text-4xl">שאלות נפוצות</h2>
          <Accordion type="single" collapsible className="reveal mt-10 w-full">
            {mod.faqs.map((item, i) => (
              <AccordionItem key={item.q} value={`${mod.id}-faq-${i}`}>
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

      <section className="section-pad">
        <div className="container-site">
          <div className="reveal mx-auto max-w-3xl text-center">
            <p className="eyebrow mx-auto">מערכת אחת</p>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              המודולים עובדים יחד.
            </h2>
            <p className="prose-site mx-auto mt-4">
              {mod.eyebrow} מתחבר לשאר המערכת — כדי שהליד, השיחה והמדידה לא יישברו באמצע.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {related.map((rel) => (
              <a
                key={rel.id}
                href={modulePath(rel.id)}
                className="bento-card reveal group flex cursor-pointer flex-col transition hover:border-cta/30"
              >
                <span className="text-xs font-semibold text-cta">{rel.eyebrow}</span>
                <h3 className="mt-2 text-xl font-bold group-hover:text-cta">{rel.teaserTitle}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {rel.teaserBody}
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

      <section className="section-pad pt-0">
        <div className="container-site">
          <div className="landing-gradient-dark reveal overflow-hidden rounded-[2rem] px-6 py-12 text-center text-[hsl(var(--surface-dark-fg))] sm:px-12">
            <h2 className="text-3xl font-extrabold sm:text-4xl">רוצה לראות את זה על העסק שלך?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              חשב כמה לידים נעלמים היום — ואז נחבר את {mod.eyebrow} לשאר המערכת.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
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
                className="h-12 cursor-pointer rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
              >
                <a href="/how-it-works">איך ההקמה עובדת</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
