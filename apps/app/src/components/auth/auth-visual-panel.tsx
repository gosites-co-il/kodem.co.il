/** Full-height auth visual column — signup10-style photo plane. */
export function AuthVisualPanel() {
  return (
    <div className="relative hidden h-full min-h-svh overflow-hidden bg-[#0B111E] lg:block">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 70% at 28% 18%, rgba(216, 17, 89, 0.55), transparent 58%),
            radial-gradient(ellipse 80% 60% at 82% 78%, rgba(33, 131, 128, 0.42), transparent 55%),
            linear-gradient(160deg, #0B111E 0%, #8F2D56 55%, #D81159 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(255,255,255,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.14)_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="absolute inset-0 flex flex-col justify-between p-10">
        <p className="text-sm font-medium tracking-wide text-white/70">
          מערכת ההפעלה של העסק
        </p>
        <div className="max-w-md space-y-3">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            קודם מבינים את העסק — ואז הכול מסתדר
          </p>
          <p className="text-sm leading-relaxed text-white/75">
            CRM, ידע, תובנות ו-AI במקום אחד — בנוי לעסקים שרוצים לגדול בלי
            להתפזר בין כלים.
          </p>
        </div>
      </div>
    </div>
  );
}
