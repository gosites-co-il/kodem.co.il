import { Button } from '@kodem/design-system/components/ui/button';
import { BusinessLinkConnect } from '../landing/BusinessLinkConnect';
import { HowItWorks } from '../landing/HowItWorks';
import { SITE_CONFIG } from '../../lib/site-config';
import { HowItWorksHeroCarousel } from './HowItWorksHeroCarousel';

export function HowItWorksPage() {
  return (
    <>
      <HowItWorksHeroCarousel />
      <HowItWorks showIntro={false} />

      <section className="section-pad landing-gradient-dark text-[hsl(var(--surface-dark-fg))]">
        <div className="container-site">
          <div className="reveal mx-auto flex max-w-xl flex-col items-center text-center">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              נותנים לינק. {SITE_CONFIG.name} בונה את עצמה.
            </h2>
            <p className="mt-3 text-white/70">
              הדביקו לינק לעסק — ונמשיך משם.
            </p>
            <BusinessLinkConnect className="mt-8" onDark />
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site">
          <div className="bento-card reveal mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">מה קורה אחרי ההקמה?</h2>
            <p className="prose-site mx-auto mt-4 max-w-xl">
              כל ליד נענה תוך שניות. אתה נכנס לפגישות שכבר נקבעו ולסגירות שכבר הבשילו —
              במקום לרדוף אחרי טפסים שנשכחו.
            </p>
            <Button
              asChild
              className="mt-6 h-11 cursor-pointer rounded-full bg-cta text-cta-foreground hover:bg-cta/90"
            >
              <a href="/product">לגלות את היכולות</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
