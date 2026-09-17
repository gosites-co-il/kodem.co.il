import { Button } from '@kodem/design-system/components/ui/button';
import { getHeroHeadline, type HeroVariantId } from '../../lib/hero-variants';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';
import { WhatsAppConversationDemo } from './WhatsAppConversationDemo';

type Props = {
  heroVariant?: HeroVariantId;
};

export function Hero({ heroVariant = 'A' }: Props) {
  const headline = getHeroHeadline(heroVariant);

  return (
    <section className="relative overflow-hidden">
      <div className="landing-gradient-hero absolute inset-0 -z-10" />
      <div className="site-grid-bg absolute inset-0 -z-10 opacity-70" aria-hidden />

      <div className="container-site grid min-h-[calc(100svh-4.25rem)] items-center gap-12 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
        <div className="order-1 flex flex-col items-stretch text-center lg:items-start lg:text-start">
          <p className="eyebrow mx-auto reveal lg:mx-0">AI מכירות · וואטסאפ · ישראל</p>
          <h1 className="display-title reveal mt-5 whitespace-pre-line">{headline}</h1>

          <div className="reveal mt-8 flex flex-col items-stretch gap-3 sm:items-center lg:items-start">
            <Button
              asChild
              size="lg"
              className="h-12 w-full cursor-pointer rounded-full bg-cta px-8 text-base text-cta-foreground shadow-soft hover:bg-cta/90 sm:w-auto sm:min-w-[300px]"
            >
              <a href="#loss-calculator">{PRIMARY_CTA_LABEL}</a>
            </Button>
            <p className="text-sm text-muted-foreground">
              60 שניות. בלי כרטיס אשראי. התוצאה תפתיע אותך.
            </p>
          </div>

          <p className="prose-site reveal mx-auto mt-8 max-w-xl lg:mx-0">
            KODEM לוכד כל ליד מכל מקור, מנהל איתו שיחת מכירה אמיתית בוואטסאפ, קובע לו
            פגישה ביומן ומראה לך בדיוק כמה כסף כל קמפיין מחזיר. הכל במערכת אחת. בעברית.
          </p>

          <div className="reveal mx-auto mt-8 flex flex-wrap justify-center gap-2 lg:mx-0 lg:justify-start">
            {['שותף רשמי Meta API', 'ללא הגבלת לידים', 'הקמה תוך 30 דקות'].map(
              (t) => (
                <span
                  key={t}
                  className="rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-sm backdrop-blur"
                >
                  {t}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="order-2 flex justify-center reveal lg:justify-end">
          <div className="relative">
            <div
              className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,hsl(173_80%_32%/0.2),transparent_65%)] blur-2xl"
              aria-hidden
            />
            <WhatsAppConversationDemo className="relative" />
          </div>
        </div>
      </div>
    </section>
  );
}
