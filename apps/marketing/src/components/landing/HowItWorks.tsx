import { SITE_CONFIG } from '../../lib/site-config';

const STEPS = [
  {
    title: 'נותנים פרט אחד',
    body: 'כתובת האתר, האינסטגרם או עמוד הפייסבוק שלך.',
  },
  {
    title: `${SITE_CONFIG.name} לומדת את העסק`,
    body: 'שירותים, מחירים, שאלות שחוזרות והטון שלך. אתה עובר, מתקן ומאשר.',
  },
  {
    title: 'מתחברים ומתחילים',
    body: 'וואטסאפ, פייסבוק וגוגל. מהרגע הזה כל ליד נענה, וכל שקל נמדד.',
  },
] as const;

type Props = {
  /** When false, only the three steps render (intro lives in the page hero carousel). */
  showIntro?: boolean;
};

/** Link-in setup narrative — how KODEM builds itself from one URL. */
export function HowItWorks({ showIntro = true }: Props) {
  return (
    <section id="how-it-works-home" className="section-pad bg-background">
      <div className="container-site">
        {showIntro ? (
          <div className="reveal mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              נותנים לינק. {SITE_CONFIG.name} בונה את עצמה.
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              בלי ידע טכני. בלי פרויקט ארוך. הקמה מלווה.
            </p>
          </div>
        ) : null}

        <ol
          className={
            showIntro
              ? 'mt-14 grid gap-10 md:grid-cols-3 md:gap-8'
              : 'grid gap-10 md:grid-cols-3 md:gap-8'
          }
        >
          {STEPS.map((step, i) => (
            <li key={step.title} className="reveal text-center md:text-start">
              <span className="font-data text-4xl font-extrabold tracking-tight text-cta sm:text-5xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
