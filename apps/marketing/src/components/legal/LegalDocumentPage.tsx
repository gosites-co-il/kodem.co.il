'use client';

import { LegalDocumentLayout } from '@kodem/design-system/components/ui/legal-document-layout';
import type { LegalDocument } from '@kodem/platform/legal';
import { Logo } from '../site/Logo';
import { SiteFooter } from '../site/SiteFooter';

export function LegalDocumentPage({
  document,
  homeHref = '/',
}: {
  document: LegalDocument;
  homeHref?: string;
}) {
  return (
    <LegalDocumentLayout
      title={document.title}
      version={document.version}
      lastUpdated={document.lastUpdated}
      sections={document.sections}
      homeHref={homeHref}
      logo={<Logo />}
      footer={<SiteFooter />}
    />
  );
}
