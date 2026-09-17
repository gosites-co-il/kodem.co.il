import { ArrowDown } from 'lucide-react';

export function PainSection() {
  return (
    <section id="pain" className="section-pad">
      <div className="container-site grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div>
          <h2 className="reveal whitespace-pre-line text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
            הפרסום מביא לידים.
            {'\n'}
            <span className="text-primary">המענה האיטי שורף אותם.</span>
          </h2>
          <div className="reveal mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              אתה משלם על כל ליד — עשרות שקלים, לפעמים יותר. הוא ממלא טופס ומחכה.
              אתה באמצע עבודה, פגישה, חיים. עד שאתה חוזר — מישהו אחר כבר ענה.
            </p>
            <p>
              זה לא חוסר מקצועיות. זה עומס של בן אדם אחד מול לידים שמגיעים
              עשרים וארבע שעות ביממה.
            </p>
            <p className="font-medium text-foreground">
              והחלק הכי יקר: בלי מדידה, אתה אפילו לא רואה כמה כסף נעלם.
            </p>
          </div>
        </div>

        <aside className="reveal relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-[hsl(var(--surface-dark))] p-6 text-[hsl(var(--surface-dark-fg))] shadow-soft sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,hsl(338_85%_46%/0.35),transparent_55%)]"
            aria-hidden
          />
          <p className="relative text-sm font-semibold text-white/65">מה קורה היום</p>
          <ul className="relative mt-5 space-y-4 text-sm leading-relaxed sm:text-base">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--spark))]" />
              ליד חם מחכה דקות — לפעמים שעות.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              פולו־אפ ידני נשבר בין וואטסאפ, אקסל והראש.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--glow))]" />
              אי אפשר לדעת איזה קמפיין באמת מחזיר כסף.
            </li>
          </ul>
          <a
            href="#loss-calculator"
            className="relative mt-8 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-[hsl(var(--spark))] hover:underline"
          >
            בוא נספור את ההפסד
            <ArrowDown className="size-4" aria-hidden />
          </a>
        </aside>
      </div>
    </section>
  );
}
