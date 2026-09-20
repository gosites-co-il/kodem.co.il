'use client';

import Link from 'next/link';
import { LegalDocumentLayout } from '@kodem/design-system/components/ui/legal-document-layout';
import type { LegalDocument } from '@kodem/platform/legal';
import { ROUTES } from '../../lib/constants';
import { marketingOrigin } from '../../lib/marketing-origin';

function LegalLogo() {
  return (
    <Link
      href={ROUTES.login}
      className="inline-flex items-center gap-2.5 text-foreground"
      aria-label="Kodem"
    >
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-foreground text-background">
        <span className="relative text-sm font-extrabold tracking-tight">K</span>
      </span>
      <span className="text-lg font-extrabold tracking-tight">Kodem</span>
    </Link>
  );
}

export function AppLegalDocumentPage({ document }: { document: LegalDocument }) {
  const homeHref = marketingOrigin();

  return (
    <LegalDocumentLayout
      title={document.title}
      version={document.version}
      lastUpdated={document.lastUpdated}
      sections={document.sections}
      homeHref={homeHref}
      logo={<LegalLogo />}
      footer={
        <footer className="border-t border-border/70 py-8 text-center text-sm text-muted-foreground">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4">
            <a href={`${homeHref}/terms`} className="hover:text-foreground hover:underline">
              תקנון שימוש
            </a>
            <a href={`${homeHref}/privacy`} className="hover:text-foreground hover:underline">
              מדיניות פרטיות
            </a>
            <a href={`${homeHref}/cookies`} className="hover:text-foreground hover:underline">
              מדיניות Cookies
            </a>
            <a href={`${homeHref}/ai-terms`} className="hover:text-foreground hover:underline">
              תנאי שימוש ב-AI
            </a>
          </div>
        </footer>
      }
    />
  );
}
