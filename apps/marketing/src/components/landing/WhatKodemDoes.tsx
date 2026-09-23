import { ArrowLeft } from 'lucide-react';
import { SITE_CONFIG } from '../../lib/site-config';

const CAPABILITIES = [
  {
    n: '01',
    title: 'לוח בקרה 24/7 על גוגל ומטא',
    body: 'כמה הוצאת, כמה פניות וכמה כסף נכנס — מכל הפלטפורמות במסך אחד.',
  },
  {
    n: '02',
    title: 'יותר כסף מאותו תקציב',
    body: 'יותר פניות הופכות לעסקאות, כך שכל שקל בפרסום מכניס לך יותר.',
  },
  {
    n: '03',
    title: 'תובנות והמלצות לרווחיות',
    body: 'על מה להפסיק לשלם, איפה להשקיע יותר, ואיפה הולך לך כסף. המלצה ברורה, לא עוד גרף.',
  },
  {
    n: '04',
    title: 'מכירה שמתאימה את עצמה',
    body: 'לומדת את העסק ומתאימה את השיחה לכל פונה — בעברית, עד פגישה או עסקה.',
  },
] as const;

/** Light capability strip — what KODEM does for the business. */
export function WhatKodemDoes() {
  return (
    <section id="what-kodem-does" className="section-pad bg-background">
      <div className="container-site">
        <div className="reveal flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            מה {SITE_CONFIG.name} עושה לעסק שלך
          </h2>
          <a
            href="/product"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-cta transition hover:text-cta/80"
          >
            לכל היכולות של המערכת
            <ArrowLeft className="size-4" aria-hidden />
          </a>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {CAPABILITIES.map((item, i) => (
            <article
              key={item.n}
              className={`reveal lg:px-6 ${
                i > 0 ? 'lg:border-s lg:border-border/80' : ''
              }`}
            >
              <p className="font-data text-sm font-bold tracking-wide text-cta">
                {item.n}
              </p>
              <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
