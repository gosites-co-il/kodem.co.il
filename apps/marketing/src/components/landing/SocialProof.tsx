import { useEffect, useRef, useState } from 'react';

const STATS = [
  {
    value: 100,
    suffix: '%',
    label: 'מהלידים מקבלים מענה — ממוצע הענף כ־52%.',
    note: 'נתון ענפי, לא תוצאת לקוח KODEM',
  },
  {
    value: 3,
    suffix: ' שנ׳',
    label: 'זמן מענה לליד חדש — מול ממוצע של כ־47 דקות בעסקים בישראל.',
    note: 'יעד מערכת · הדגמה',
  },
  {
    value: 3.5,
    suffix: '×',
    label: 'יותר סגירות לליד שנענה תוך 5 דקות לעומת ליד שחיכה שעה.',
    note: 'מחקר ענפי ידוע',
  },
] as const;

function useCountUp(target: number, active: boolean, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setValue(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 1100;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, decimals]);

  return value;
}

function StatCard({
  value,
  suffix,
  label,
  note,
  active,
}: {
  value: number;
  suffix: string;
  label: string;
  note: string;
  active: boolean;
}) {
  const decimals = Number.isInteger(value) ? 0 : 1;
  const shown = useCountUp(value, active, decimals);

  return (
    <article className="tech-panel relative overflow-hidden border-[hsl(var(--glow))]/20 p-6 sm:p-7">
      <p className="font-data relative text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
        {decimals ? shown.toFixed(1) : Math.round(shown)}
        {suffix}
      </p>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{label}</p>
      <p className="relative mt-3 font-data text-xs text-muted-foreground/80">{note}</p>
    </article>
  );
}

export function SocialProof() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.35 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-label="נתוני אמון"
      className="relative border-y border-border/70 bg-muted/30"
    >
      <div className="container-site py-12 md:py-14">
        <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          המספרים שכולם יודעים — והעסק שלך עדיין משלם עליהם.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}
