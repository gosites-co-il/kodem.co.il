import { Button } from '@kodem/design-system/components/ui/button';
import { PageHero } from '../site/PageHero';
import { Pricing } from '../landing/Pricing';
import { FAQ } from '../landing/FAQ';
import { Comparison } from '../landing/Comparison';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';

export function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="מחירון שקוף"
        title={'תזכור את המספר מהמחשבון.\nעכשיו תסתכל על המחירים.'}
        description="שלוש תוכניות. בלי אותיות קטנות. דמי הקמה חד־פעמיים כוללים ליווי מלא."
        align="center"
      >
        <Button
          asChild
          size="lg"
          className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
        >
          <a href="/#loss-calculator">{PRIMARY_CTA_LABEL}</a>
        </Button>
      </PageHero>
      <Pricing />
      <Comparison />
      <FAQ />
    </>
  );
}
