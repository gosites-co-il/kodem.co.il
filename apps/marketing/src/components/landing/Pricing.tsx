import { Check } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { cn } from '@kodem/design-system/lib/utils';
import { track } from '../../lib/analytics';
import { formatIls } from '../../lib/calculator';
import { PRICING_PLANS, SETUP_FEE_ILS } from '../../lib/pricing';
import { SITE_CONFIG } from '../../lib/site-config';

export function Pricing() {
  return (
    <section id="pricing" className="bg-muted/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-base font-medium text-muted-foreground">
          זכרת את המספר מהמחשבון? עכשיו תסתכל מה עולה לתקן את זה.
        </p>
        <h2 className="sr-only">מחירון</h2>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const href = `${SITE_CONFIG.appSignupBase}?plan=${plan.id}`;
            const featured = plan.id === 'growth';
            return (
              <article
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-3xl border bg-card p-6 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-soft sm:p-8',
                  featured
                    ? 'border-brand/30 ring-2 ring-cta/25 lg:-translate-y-2'
                    : 'border-border/80',
                )}
              >
                {plan.badge ? (
                  <Badge className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-cta text-cta-foreground">
                    {plan.badge}
                  </Badge>
                ) : null}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">
                  {formatIls(plan.priceIls)}
                  <span className="text-base font-medium text-muted-foreground">
                    {' '}
                    לחודש
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-cta" aria-hidden />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'mt-8 h-12 w-full cursor-pointer',
                    featured
                      ? 'bg-cta text-cta-foreground hover:bg-cta/90'
                      : '',
                  )}
                >
                  <a
                    href={href}
                    onClick={() =>
                      track('pricing_cta_clicked', { plan: plan.id })
                    }
                  >
                    {plan.cta}
                  </a>
                </Button>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
          דמי הקמה חד פעמיים {formatIls(SETUP_FEE_ILS)}, כוללים ליווי אישי מלא עד
          שהמערכת עובדת. בלי אותיות קטנות, בלי תוספות מפתיעות.
        </p>
      </div>
    </section>
  );
}
