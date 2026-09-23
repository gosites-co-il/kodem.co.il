import { useCallback, useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@kodem/design-system/components/ui/carousel';
import { cn } from '@kodem/design-system/lib/utils';
import { SITE_CONFIG } from '../../lib/site-config';

const STEPS = [
  {
    id: 'link',
    title: 'נותנים פרט אחד',
    body: 'כתובת האתר, האינסטגרם או עמוד הפייסבוק שלך.',
  },
  {
    id: 'learn',
    title: `${SITE_CONFIG.name} לומדת את העסק`,
    body: 'שירותים, מחירים, שאלות שחוזרות והטון שלך. אתה עובר, מתקן ומאשר.',
  },
  {
    id: 'connect',
    title: 'מתחברים ומתחילים',
    body: 'וואטסאפ, פייסבוק וגוגל. מהרגע הזה כל ליד נענה, וכל שקל נמדד.',
  },
] as const;

/** Link-in setup narrative — steps as carousel (home + /how-it-works). */
export function HowItWorks() {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const onSelect = useCallback((embla: CarouselApi) => {
    if (!embla) return;
    setIndex(embla.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
      api.off('reInit', onSelect);
    };
  }, [api, onSelect]);

  useEffect(() => {
    if (!api || paused) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const id = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 5000);
    return () => clearInterval(id);
  }, [api, paused]);

  return (
    <section
      id="how-it-works-home"
      className="section-pad bg-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="container-site">
        <div className="reveal mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            נותנים לינק. {SITE_CONFIG.name} בונה את עצמה.
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            בלי ידע טכני. בלי פרויקט ארוך. הקמה מלווה.
          </p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: 'center', direction: 'rtl' }}
          className="mx-auto mt-12 w-full max-w-2xl"
          aria-roledescription="carousel"
          aria-label="שלבי ההקמה"
        >
          <CarouselContent>
            {STEPS.map((step, i) => (
              <CarouselItem
                key={step.id}
                aria-hidden={i !== index}
                className={i !== index ? 'pointer-events-none' : undefined}
              >
                <div className="flex min-h-[14rem] flex-col items-center justify-center px-4 text-center sm:min-h-[16rem]">
                  <span className="font-data text-5xl font-extrabold tracking-tight text-cta sm:text-6xl">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((step, i) => (
            <button
              key={step.id}
              type="button"
              className={cn(
                'h-2.5 cursor-pointer rounded-full transition-all',
                i === index
                  ? 'w-8 bg-primary'
                  : 'w-2.5 bg-border hover:bg-muted-foreground/40',
              )}
              aria-label={`שלב ${i + 1}: ${step.title}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
