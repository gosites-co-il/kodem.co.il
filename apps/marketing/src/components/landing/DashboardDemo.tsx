import { cn } from '@kodem/design-system/lib/utils';

const METRICS = [
  { label: 'לידים היום', value: '214', hint: 'מכל מקורות הפרסום' },
  { label: 'ROAS', value: '4.2×', hint: 'מהקליק עד הסגירה' },
  { label: 'פגישות', value: '38', hint: 'נקבעו מהשיחה' },
  { label: 'סגירות', value: '12', hint: 'השבוע' },
] as const;

type Props = {
  className?: string;
  /** Compact strip for homepage / product side panels. */
  compact?: boolean;
};

/** Illustrative ads→cash dashboard — always labeled הדגמה, never as live data. */
export function DashboardDemo({ className, compact = false }: Props) {
  return (
    <div
      className={cn(
        'landing-gradient-dark relative overflow-hidden rounded-2xl border border-[hsl(var(--glow))]/25 text-[hsl(var(--surface-dark-fg))] shadow-soft',
        compact ? 'p-5 sm:p-6' : 'min-h-[22rem] p-6 sm:p-8',
        className,
      )}
      role="img"
      aria-label="הדגמה ויזואלית של לוח בקרה מהפרסום ועד הקופה"
    >
      <div className="relative flex items-center justify-between gap-3">
        <p className="font-data text-xs font-semibold tracking-wide text-[hsl(var(--glow))]">
          מהפרסום → הקופה
        </p>
        <span className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 font-data text-[10px] font-bold tracking-wide text-white/70">
          הדגמה
        </span>
      </div>

      <div
        className={cn(
          'relative grid gap-3',
          compact ? 'mt-4 grid-cols-2' : 'mt-6 grid-cols-2 sm:mt-8',
        )}
      >
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-[hsl(var(--glow))]/20 bg-white/5 p-3 sm:p-4"
          >
            <p className="text-xs text-white/60">{m.label}</p>
            <p
              className={cn(
                'font-data mt-1 font-bold tracking-tight text-[hsl(var(--spark))]',
                compact ? 'text-2xl' : 'text-3xl sm:text-4xl',
              )}
            >
              {m.value}
            </p>
            {!compact ? (
              <p className="mt-1 text-[11px] leading-snug text-white/45">{m.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      {!compact ? (
        <p className="relative mt-6 text-sm text-white/65">
          הוצאה, לידים, פגישות וסגירות — באותו מסך. בלי לנחש אם הקמפיין עובד.
        </p>
      ) : null}
    </div>
  );
}
