import { Button } from '@kodem/design-system/components/ui/button';
import { PRIMARY_CTA_LABEL, SITE_CONFIG } from '../../lib/site-config';

export function FinalCTA() {
  const showUrgency = SITE_CONFIG.launchSlotLimit > 0;

  return (
    <section className="section-pad">
      <div className="container-site">
        <div className="landing-gradient-dark reveal relative overflow-hidden rounded-[2rem] px-6 py-14 text-center text-[hsl(var(--surface-dark-fg))] sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 site-grid-bg opacity-30"
            aria-hidden
          />
          <h2 className="relative whitespace-pre-line text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            בזמן שקראת את הדף הזה,
            {'\n'}
            ליד אחד לפחות חיפש את מה שאתה מוכר.
          </h2>
          <p className="relative mt-4 text-lg text-white/75">
            השאלה היחידה היא מי ענה לו קודם.
          </p>
          <Button
            asChild
            size="lg"
            className="relative mt-8 h-12 cursor-pointer rounded-full bg-cta px-8 text-base text-cta-foreground hover:bg-cta/90"
          >
            <a href="#loss-calculator">{PRIMARY_CTA_LABEL}</a>
          </Button>
          <p className="relative mt-4 text-sm text-white/60">
            60 שניות למחשבון. 30 דקות להקמה. מהיום, אף ליד לא הולך לאיבוד.
          </p>
          {showUrgency ? (
            <p className="relative mt-6 text-sm font-medium text-emerald-300">
              מחיר השקה + ליווי הקמה אישי: מוגבל ל-{SITE_CONFIG.launchSlotLimit}{' '}
              עסקים בחודש הקרוב.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
