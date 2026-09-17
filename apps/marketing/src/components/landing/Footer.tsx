import { SITE_CONFIG } from '../../lib/site-config';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center sm:px-6">
        <p className="text-lg font-bold">{SITE_CONFIG.name}</p>
        <nav aria-label="קישורים משפטיים" className="flex flex-wrap justify-center gap-4 text-sm">
          <a
            href="/privacy"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            מדיניות פרטיות
          </a>
          <a
            href="/terms"
            className="cursor-pointer text-muted-foreground hover:text-foreground"
          >
            תנאי שימוש
          </a>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {year} {SITE_CONFIG.name}. כל הזכויות שמורות.
        </p>
      </div>
    </footer>
  );
}
