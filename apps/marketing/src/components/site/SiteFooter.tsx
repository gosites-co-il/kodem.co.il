import { FOOTER_NAV } from '../../lib/nav';
import { PRIMARY_CTA_LABEL, SITE_CONFIG } from '../../lib/site-config';
import { openCookiePreferences } from '@kodem/design-system/lib/cookie-consent';
import { Logo } from './Logo';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-8 border-t border-border/80 bg-[hsl(var(--surface-dark))] text-[hsl(var(--surface-dark-fg))]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_0%,hsl(199_89%_48%/0.18),transparent_55%)]" />
      <div className="container-site relative py-14 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo className="text-white [&_span:last-child]:text-white" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
              מערכת אחת ללידים, וואטסאפ, תורים ואנליטיקס — בעברית, לעסקים בישראל.
            </p>
            <a
              href="/#loss-calculator"
              className="mt-6 inline-flex cursor-pointer rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-cta-foreground transition hover:bg-cta/90"
            >
              {PRIMARY_CTA_LABEL}
            </a>
          </div>

          <FooterCol title="מוצר" items={FOOTER_NAV.product} />
          <FooterCol title="חברה" items={FOOTER_NAV.company} />
          <FooterCol title="משפטי" items={FOOTER_NAV.legal} />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {SITE_CONFIG.name}. כל הזכויות שמורות.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <button
              type="button"
              onClick={() => openCookiePreferences()}
              className="cursor-pointer text-white/60 transition hover:text-white"
            >
              הגדרות עוגיות
            </button>
            <p>נבנה לעסקים בישראל · Meta API</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="cursor-pointer text-sm text-white/60 transition hover:text-white"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
