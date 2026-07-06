import Link from 'next/link';

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div aria-hidden className="auth-dot-grid pointer-events-none absolute inset-0" />
      <div aria-hidden className="auth-top-glow pointer-events-none absolute inset-0" />

      <div className="relative z-10 w-full max-w-[420px] space-y-8">
        <div className="space-y-2 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              K
            </span>
            Kodem
          </Link>
          <div className="space-y-1 pt-4">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        {children}

        {footer ? (
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </div>
  );
}
