import { cn } from '@kodem/design-system/lib/utils';

type Props = {
  /** @deprecated Kickers/eyebrows are banned by the design craft floor; ignored. */
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'start' | 'center';
  dark?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function PageHero({
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
      <div
        className={cn(
          'container-site relative',
          align === 'center' && 'text-center',
        )}
      >
        <h1
          className={cn(
            'display-title reveal max-w-4xl whitespace-pre-line',
            align === 'center' && 'mx-auto',
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
