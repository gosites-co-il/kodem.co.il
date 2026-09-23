import { Button } from '@kodem/design-system/components/ui/button';
import { HowItWorks } from '../landing/HowItWorks';
import { HowItWorksHeroCarousel } from './HowItWorksHeroCarousel';

export function HowItWorksPage() {
  return (
    <>
      <HowItWorksHeroCarousel />
      <HowItWorks showIntro={false} />
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
