import { ArrowLeft } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { SITE_CONFIG } from '../../lib/site-config';

const GAPS = [
  {
    title: 'פייסבוק וגוגל',
    body: 'יודעים כמה עלה כל ליד, אבל לא אם הוא הפך לכסף.',
  },
  {
    title: 'בוט הודעות',
    body: 'מגיב ומנהל שיחת שירות או מכירה, אבל לא יודע כמה עלה הליד.',
  },
  {
    title: 'תוכנה לניהול לקוחות',
    body: 'מתחילה לעבוד רק מהרגע שהפנייה נכנסת. לא יודעת מאיפה הלקוח הגיע וכמה עלה להביא אותו.',
  },
  {
    title: 'דוחות, ניתוח AI ואקסלים',
    body: 'מישהו צריך לחבר את הנתונים לבד. זה לוקח זמן, והתמונה מגיעה כשכבר מאוחר.',
  },
] as const;

/** Dark מהפרסום→קופה narrative: stack gaps, then KODEM as the connected path. */
export function AdsToCash() {
  return (
    <section
      id="ads-to-cash"
      className="section-pad landing-gradient-dark text-[hsl(var(--surface-dark-fg))]"
    >
      <div className="container-site">
        <div className="reveal max-w-3xl">
          <p className="font-data text-sm font-semibold tracking-wide text-[hsl(var(--spark))]">
            מהפרסום ועד הקופה
          </p>
          <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            כשאתה רואה כל שלב בדרך,
            <br />
            אתה יודע איפה נמצא הכסף.
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {GAPS.map((item) => (
            <article key={item.title} className="reveal">
              <h3 className="text-lg font-bold tracking-tight">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{item.body}</p>
            </article>
          ))}
        </div>

        <div
          className="my-14 h-px w-full bg-cta/70 sm:my-16"
          role="separator"
          aria-hidden
        />

        <div className="reveal max-w-4xl">
          <p className="font-data text-sm font-semibold tracking-wide text-[hsl(var(--spark))]">
            {SITE_CONFIG.name}
          </p>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            מהשקל שהוצאת, לתהליך מכירה מלא ועד העסקה או הפגישה שנסגרה. הכל קורה
            מולך.
          </h2>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-14">
          <p className="reveal text-xl font-bold leading-snug tracking-tight sm:text-2xl">
            מענה מהיר מביא אותך לשיחה. תהליך מכירה נכון מביא את הכסף.
          </p>
          <div className="reveal">
            <p className="text-sm leading-relaxed text-white/70 sm:text-base">
              כשאתה יודע כל שלב על הלקוח שהגיע — מכמה עלה להביא אותו, דרך השיחה
              והפולו־אפ ועד הסגירה — אתה מפסיק לנחש. אתה יודע איפה להשקיע, על מה
              להפסיק לשלם, ואיך להכניס יותר כסף מאותו תקציב.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-6 h-11 cursor-pointer rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
            >
              <a href="/product#dashboard" className="inline-flex items-center gap-2">
                ללוח הבקרה במוצר
                <ArrowLeft className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
