import { ArrowLeft } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';

/** Short homepage band → /agencies. */
export function AgenciesBand() {
  return (
    <section id="agencies-teaser" className="section-pad pt-0">
      <div className="container-site">
        <div className="landing-gradient-dark reveal overflow-hidden rounded-2xl px-6 py-10 text-[hsl(var(--surface-dark-fg))] sm:px-10 sm:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_auto]">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                לסוכנויות דיגיטל
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">
                לקוחות רבים, דיווחים שקופים, ו־Pro שמתאים לסוכנויות שמנהלות נפח גבוה —
                בלי לבנות מערכת נפרדת לכל לקוח.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 w-full cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90 sm:w-auto"
            >
              <a href="/agencies" className="inline-flex items-center gap-2">
                לעמוד הסוכנויות
                <ArrowLeft className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
