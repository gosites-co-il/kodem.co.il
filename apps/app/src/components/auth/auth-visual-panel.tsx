/** Decorative window panel for the auth split layout. */
export function AuthVisualPanel() {
  return (
    <div className="relative flex h-full min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-muted/40 p-6 sm:min-h-[420px] sm:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_40%,hsl(var(--foreground)/0.04),transparent_70%)]"
      />

      <div className="relative w-full max-w-[280px] overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm sm:max-w-[320px]">
        <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2.5">
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>

        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-muted/30 to-background p-10">
          <KodemMark className="h-28 w-28 text-foreground sm:h-36 sm:w-36" />
        </div>
      </div>
    </div>
  );
}

function KodemMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M20 78 L60 98 L100 78 L100 42 L60 22 L20 42 Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M60 22 V98"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M20 42 L60 62 L100 42"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M36 50 L36 70 L52 78 L52 58 Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M68 58 L84 50 L84 70 L68 78 Z"
        fill="currentColor"
        fillOpacity="0.18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeDasharray="3 3"
      />
    </svg>
  );
}
