/**
 * Testimonials section — intentionally empty until real quotes exist.
 * Never invent names, businesses, or results.
 */
export function Testimonials() {
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <section
      className="border border-dashed border-amber-500/40 bg-amber-500/5 py-8"
      aria-hidden
    >
      <p className="text-center text-sm text-amber-800 dark:text-amber-200">
        [dev] Testimonials placeholder — מוסתר בפרודקשן עד שיהיו המלצות אמיתיות.
      </p>
    </section>
  );
}
