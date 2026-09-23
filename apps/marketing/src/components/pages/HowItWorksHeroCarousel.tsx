import { useCallback, useEffect, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@kodem/design-system/components/ui/carousel';
import { cn } from '@kodem/design-system/lib/utils';
import { NAV_SIGNUP_HREF, SITE_CONFIG } from '../../lib/site-config';

const SLIDES = [
  {
    id: 'signup',
    headline: 'מהרשמה ללידים שנענים לבד.\n30 דקות.',
    body: 'ליווי מלא שלנו בהקמה. אתה מאשר איך המערכת עונה — ורק אז היא פוגשת לקוח.',
    cta: { href: NAV_SIGNUP_HREF, label: 'מתחילים עכשיו' } as const,
  },
  {
    id: 'link',
    headline: `נותנים לינק. ${SITE_CONFIG.name} בונה את עצמה.`,
    body: 'בלי ידע טכני. בלי פרויקט ארוך. הקמה מלווה.',
    cta: { href: NAV_SIGNUP_HREF, label: 'מתחילים עכשיו' } as const,
  },
] as const;

/** Two-slide hero for /how-it-works — signup story + link-in story. */
export function HowItWorksHeroCarousel() {
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
    }, 6000);
    return () => clearInterval(id);
  }, [api, paused]);

  return (
    <section
      className="page-hero relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="landing-gradient-hero absolute inset-0 -z-10" />
      <div className="container-site relative">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: 'start', direction: 'rtl' }}
          className="w-full"
          aria-roledescription="carousel"
          aria-label="איך ההקמה עובדת"
        >
          <CarouselContent>
            {SLIDES.map((slide, slideIndex) => {
              const active = slideIndex === index;
              return (
                <CarouselItem
                  key={slide.id}
                  aria-hidden={!active}
                  className={!active ? 'pointer-events-none' : undefined}
                >
                  <div className="flex min-h-[16rem] max-w-3xl flex-col justify-center sm:min-h-[18rem]">
                    {active ? (
                      <h1 className="display-title whitespace-pre-line">
                        {slide.headline}
                      </h1>
                    ) : (
                      <p className="display-title whitespace-pre-line">
                        {slide.headline}
                      </p>
                    )}
                    <p className="prose-site mt-5 max-w-2xl">{slide.body}</p>
                    {slide.cta ? (
                      <div className="mt-8">
                        <Button
                          asChild
                          size="lg"
                          tabIndex={active ? 0 : -1}
                          className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
                        >
                          <a href={slide.cta.href}>{slide.cta.label}</a>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex items-center justify-start gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className={cn(
                'h-2.5 cursor-pointer rounded-full transition-all',
                i === index
                  ? 'w-8 bg-primary'
                  : 'w-2.5 bg-border hover:bg-muted-foreground/40',
              )}
              aria-label={`שקופית ${i + 1}: ${slide.id}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
