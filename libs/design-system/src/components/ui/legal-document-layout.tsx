'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';

export type LegalDocumentLayoutSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type LegalDocumentLayoutProps = {
  title: string;
  version: string;
  lastUpdated: string;
  sections: LegalDocumentLayoutSection[];
  homeHref?: string;
  homeLabel?: string;
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  formatLastUpdated?: (isoDate: string) => string;
};

function defaultFormatLastUpdated(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function LegalDocumentLayout({
  title,
  version,
  lastUpdated,
  sections,
  homeHref = '/',
  homeLabel = 'חזרה ל-Kodem',
  logo,
  footer,
  className,
  formatLastUpdated = defaultFormatLastUpdated,
}: LegalDocumentLayoutProps) {
  return (
    <div
      dir="rtl"
      className={cn(
        'min-h-screen scroll-smooth bg-background text-foreground',
        className,
      )}
    >
      <header className="border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">{logo}</div>
          <a
            href={homeHref}
            className="shrink-0 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {homeLabel}
          </a>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[240px_minmax(0,42rem)] lg:py-14">
        <aside className="hidden lg:block">
          <nav
            aria-label="תוכן עניינים"
            className="sticky top-8 space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4"
          >
            <p className="text-xs font-semibold tracking-wide text-muted-foreground">
              תוכן עניינים
            </p>
            <ol className="space-y-2 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="tabular-nums text-foreground/50">
                      {index + 1}.
                    </span>{' '}
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <article className="min-w-0">
          <header className="border-b border-border/60 pb-6">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div>
                <dt className="inline">גרסה </dt>
                <dd className="inline font-medium text-foreground">{version}</dd>
              </div>
              <div>
                <dt className="inline">עדכון אחרון: </dt>
                <dd className="inline font-medium text-foreground">
                  {formatLastUpdated(lastUpdated)}
                </dd>
              </div>
            </dl>
          </header>

          <nav
            aria-label="תוכן עניינים לנייד"
            className="mt-6 rounded-xl border border-border/70 bg-muted/20 p-4 lg:hidden"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              תוכן עניינים
            </p>
            <ol className="mt-3 space-y-2 text-sm">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8 space-y-10">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="text-xl font-semibold tracking-tight">
                  <span className="tabular-nums text-muted-foreground">
                    {index + 1}.
                  </span>{' '}
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-[15px] leading-7 text-foreground/90">
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>

      {footer}
    </div>
  );
}
