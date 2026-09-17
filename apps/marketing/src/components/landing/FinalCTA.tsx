import { Button } from '@kodem/design-system/components/ui/button';
import { PRIMARY_CTA_LABEL, SITE_CONFIG } from '../../lib/site-config';

export function FinalCTA() {
  const showUrgency = SITE_CONFIG.launchSlotLimit > 0;

  return (
    <section className="section-pad pt-8">
      <div className="container-site">
        <div className="landing-gradient-signal relative overflow-hidden rounded-2xl px-6 py-14 text-center text-primary-foreground sm:px-12 sm:py-16">
          <h2 className="relative whitespace-pre-line text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            בזמן שקראת את הדף,
            {'\n'}
            ליד אחד כבר חיפש את מה שאתה מוכר.
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
            השאלה היחידה: מי ענה לו קודם — אתה, או המתחרה.
          </p>
          <Button
            asChild
            size="lg"
            className="relative mt-8 h-12 cursor-pointer rounded-full border border-primary-foreground/25 bg-[hsl(var(--surface-dark))] px-8 text-base font-semibold text-[hsl(var(--surface-dark-fg))] hover:bg-[hsl(var(--surface-mid))]"
          >
            <a href="#loss-calculator">{PRIMARY_CTA_LABEL}</a>
          </Button>
          <p className="relative mt-4 text-sm text-primary-foreground/75">
            60 שניות למחשבון. הקמה מלווה. מהיום — פחות לידים שנעלמים.
          </p>
          {showUrgency ? (
            <p className="relative mt-6 text-sm font-medium text-[hsl(var(--spark))]">
              מחיר השקה + ליווי הקמה אישי: מוגבל ל-{SITE_CONFIG.launchSlotLimit}{' '}
              עסקים בחודש הקרוב.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
