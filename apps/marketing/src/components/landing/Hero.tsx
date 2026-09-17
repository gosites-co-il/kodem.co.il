import { useCallback, useEffect, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@kodem/design-system/components/ui/carousel';
import { cn } from '@kodem/design-system/lib/utils';
import { PRIMARY_CTA_LABEL } from '../../lib/site-config';
import { WhatsAppConversationDemo } from './WhatsAppConversationDemo';

const SLIDES = [
  {
    id: 'answer',
    headline: 'כל ליד מקבל מענה תוך 3 שניות.\nגם כשאתה עסוק.',
    body: 'KODEM לוכד לידים מפייסבוק, אינסטגרם ווואטסאפ — ומנהל שיחת מכירה בעברית עד שנקבעת פגישה.',
    visual: 'whatsapp' as const,
  },
  {
    id: 'capture',
    headline: 'אף ליד לא נופל בין הכיסאות.\nהכל נכנס למשפך אחד.',
    body: 'מכל מקור — טופס, מודעה או אקסל ישן — הליד מתויג, נכנס לתהליך ומקבל פולו־אפ אוטומטי.',
    visual: 'pipeline' as const,
  },
  {
    id: 'measure',
    headline: 'רואים כמה כל שקל פרסום מחזיר.\nואז מתקנים.',
    body: 'מקצה לקצה: מהקליק עד הסגירה. פעם בשבוע — תיקון אחד ברור, לא עוד “נראה לי”.',
    visual: 'roas' as const,
  },
] as const;

const PIPELINE = [
  { label: 'מודעה', tone: 'muted' },
  { label: 'ליד חדש', tone: 'spark' },
  { label: 'שיחה', tone: 'primary' },
  { label: 'פגישה', tone: 'trust' },
] as const;

function PipelineStage() {
  return (
    <div
      className="tech-panel flex h-full min-h-[22rem] flex-col justify-center gap-4 border-[hsl(var(--glow))]/30 p-6 sm:p-8"
      role="img"
      aria-label="הדגמה ויזואלית של משפך לידים"
    >
      <p className="font-data text-xs font-semibold tracking-wide text-[hsl(var(--trust))]">
        PIPELINE · LIVE
      </p>
      <div className="space-y-2.5">
        {PIPELINE.map((step, i) => (
          <div
            key={step.label}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-4 py-3 transition',
              step.tone === 'primary' && 'border-primary/35 bg-primary/5',
              step.tone === 'spark' && 'border-[hsl(var(--spark))]/45 bg-[hsl(var(--spark))]/10',
              step.tone === 'trust' && 'border-[hsl(var(--trust))]/35 bg-[hsl(var(--trust))]/10',
              step.tone === 'muted' && 'border-border bg-muted/60',
            )}
          >
            <span
              className={cn(
                'font-data flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white',
                step.tone === 'primary' && 'bg-primary',
                step.tone === 'spark' && 'bg-[hsl(var(--spark))] text-foreground',
                step.tone === 'trust' && 'bg-[hsl(var(--trust))]',
                step.tone === 'muted' && 'bg-foreground/70',
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="font-semibold">{step.label}</span>
            {i < PIPELINE.length - 1 ? (
              <span className="ms-auto font-data text-xs text-muted-foreground">→</span>
            ) : (
              <span className="ms-auto rounded-md bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                נסגר
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoasStage() {
  return (
    <div
      className="landing-gradient-dark relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-2xl border border-[hsl(var(--glow))]/25 p-6 text-[hsl(var(--surface-dark-fg))] shadow-soft sm:p-8"
      role="img"
      aria-label="הדגמה ויזואלית של מדידת החזר פרסום"
    >
      <p className="relative font-data text-xs font-semibold tracking-wide text-[hsl(var(--glow))]">
        ROAS · LIVE
      </p>
      <div className="relative">
        <p className="font-data text-6xl font-extrabold tracking-tight text-[hsl(var(--spark))] sm:text-7xl">
          4.2×
        </p>
        <p className="mt-2 text-lg text-white/80">החזר על כל שקל פרסום</p>
      </div>
      <div className="relative grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[hsl(var(--glow))]/20 bg-white/5 p-3">
          <p className="text-xs text-white/60">לידים שנענו</p>
          <p className="font-data mt-1 text-2xl font-bold">100%</p>
        </div>
        <div className="rounded-xl border border-[hsl(var(--glow))]/20 bg-white/5 p-3">
          <p className="text-xs text-white/60">זמן מענה</p>
          <p className="font-data mt-1 text-2xl font-bold">3 שנ׳</p>
        </div>
      </div>
    </div>
  );
}

function SlideVisual({ kind }: { kind: (typeof SLIDES)[number]['visual'] }) {
  if (kind === 'whatsapp') {
    return (
      <div className="relative flex min-h-[22rem] items-center justify-center">
        <div
          className="absolute -inset-4 rounded-2xl bg-[radial-gradient(circle_at_50%_40%,hsl(187_62%_66%/0.28),transparent_65%)] blur-2xl"
          aria-hidden
        />
        <WhatsAppConversationDemo className="relative" />
      </div>
    );
  }
  if (kind === 'pipeline') return <PipelineStage />;
  return <RoasStage />;
}

export function Hero() {
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
    }, 5500);
    return () => clearInterval(id);
  }, [api, paused]);

  return (
    <section
      className="relative overflow-hidden"
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
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70%] bg-[radial-gradient(ellipse_at_70%_0%,hsl(338_85%_46%/0.08),transparent_55%)]"
        aria-hidden
      />

      <div className="container-site py-10 sm:py-14 lg:py-16">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: 'start', direction: 'rtl' }}
          className="w-full"
          aria-roledescription="carousel"
          aria-label="הצגת יכולות KODEM"
        >
          <CarouselContent>
            {SLIDES.map((slide, slideIndex) => (
              <CarouselItem
                key={slide.id}
                aria-hidden={slideIndex !== index}
                className={slideIndex !== index ? 'pointer-events-none' : undefined}
              >
                <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                  <div className="flex min-h-[18rem] flex-col justify-center text-center lg:min-h-[28rem] lg:text-start">
                    {slideIndex === index ? (
                      <h1 className="display-title whitespace-pre-line">{slide.headline}</h1>
                    ) : (
                      <p className="display-title whitespace-pre-line">{slide.headline}</p>
                    )}
                    <p className="prose-site mx-auto mt-5 max-w-xl lg:mx-0">{slide.body}</p>
                    <div className="mt-8 flex flex-col items-stretch gap-3 sm:items-center lg:items-start">
                      <Button
                        asChild
                        size="lg"
                        className="h-12 w-full cursor-pointer rounded-full bg-cta px-8 text-base font-semibold text-cta-foreground shadow-soft hover:bg-cta/90 sm:w-auto sm:min-w-[280px]"
                        tabIndex={slideIndex === index ? 0 : -1}
                      >
                        <a href="#loss-calculator">{PRIMARY_CTA_LABEL}</a>
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        60 שניות. בלי כרטיס אשראי. רק המספרים שלך.
                      </p>
                    </div>
                  </div>
                  <div className="mx-auto w-full max-w-md lg:max-w-none">
                    <SlideVisual kind={slide.visual} />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
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
