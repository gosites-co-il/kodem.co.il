import { cn } from '@kodem/design-system/lib/utils';

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  dark?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  align = 'start',
  dark = false,
  className,
  children,
}: Props) {
  return (
    <section
      className={cn(
        'page-hero',
        dark && 'landing-gradient-dark text-[hsl(var(--surface-dark-fg))]',
        className,
      )}
    >
      {!dark ? <div className="landing-gradient-hero absolute inset-0 -z-10" /> : null}
      <div className="site-grid-bg absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div
        className={cn(
          'container-site relative',
          align === 'center' && 'text-center',
        )}
      >
        {eyebrow ? (
          <p className={cn('eyebrow reveal', dark && 'border-white/15 bg-white/10 text-white/80')}>
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            'display-title reveal mt-5 max-w-4xl whitespace-pre-line',
            align === 'center' && 'mx-auto',
            dark && 'text-gradient-light',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={cn(
              'prose-site reveal mt-5 max-w-2xl',
              align === 'center' && 'mx-auto',
              dark && 'text-white/70',
            )}
          >
            {description}
          </p>
        ) : null}
        {children ? <div className="reveal mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
