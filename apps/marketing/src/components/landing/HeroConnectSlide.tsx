import { SITE_CONFIG } from '../../lib/site-config';
import { BusinessLinkConnect } from './BusinessLinkConnect';

type Props = {
  /** When false, disable interactive controls (off-screen carousel slide). */
  active: boolean;
};

/** Centered connect hero — artifact copy/layout, incumbent KODEM tokens. */
export function HeroConnectSlide({ active }: Props) {
  return (
    <div className="mx-auto flex min-h-[22rem] max-w-3xl flex-col items-center py-4 text-center sm:min-h-[28rem] sm:py-6">
      <p className="text-sm font-medium text-muted-foreground">
        <span className="font-extrabold text-foreground">{SITE_CONFIG.name}</span>
        <span className="mx-2 inline-block size-1.5 rounded-full bg-cta align-middle" aria-hidden />
        מערכת פרסום ומכירות
      </p>

      {active ? (
        <h1 className="display-title mt-5 max-w-2xl">
          מי שעונה קודם סוגר.
          <br />
          <span className="text-cta">מי שיודע קודם מרוויח.</span>
        </h1>
      ) : (
        <p className="display-title mt-5 max-w-2xl">
          מי שעונה קודם סוגר.
          <br />
          <span className="text-cta">מי שיודע קודם מרוויח.</span>
        </p>
      )}

      <p className="prose-site mx-auto mt-5 max-w-xl">
        KODEM מחברת את גוגל ומטא למסך אחד, מנהלת כל פנייה בוואטסאפ עד עסקה, ומראה
        לך בכל רגע כמה כל שקל פרסום הכניס.
      </p>

      <BusinessLinkConnect active={active} className="mt-8" />
    </div>
  );
}
