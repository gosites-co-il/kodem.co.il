'use client';

import * as React from 'react';
import { Button } from './button';
import { Label } from './label';
import { Switch } from './switch';
import { cn } from '../../lib/utils';
import {
  COOKIE_CONSENT_OPEN_EVENT,
  acceptAllCookieConsent,
  readCookieConsent,
  rejectNonEssentialCookieConsent,
  writeCookieConsent,
  type CookieConsentCategories,
} from '../../lib/cookie-consent';

export type CookieBannerCategory = {
  id: keyof Omit<CookieConsentCategories, 'essential'> | 'essential';
  title: string;
  description: string;
  locked?: boolean;
};

export type CookieBannerProps = {
  className?: string;
  privacyHref?: string;
  privacyLabel?: string;
  cookiesHref?: string;
  cookiesLabel?: string;
  message?: string;
  categories?: CookieBannerCategory[];
  labels?: {
    reject?: string;
    customize?: string;
    acceptAll?: string;
    save?: string;
  };
};

const DEFAULT_CATEGORIES: CookieBannerCategory[] = [
  {
    id: 'essential',
    title: 'הכרחיות',
    description: 'נדרשות לתפקוד האתר, אבטחה והעדפות בסיסיות.',
    locked: true,
  },
  {
    id: 'analytics',
    title: 'אנליטיקה',
    description: 'עוזרות לנו להבין שימוש ולשפר את המוצר.',
  },
  {
    id: 'marketing',
    title: 'שיווק',
    description: 'מדידה פרסומית והתאמת תוכן שיווקי.',
  },
];

export function CookieBanner({
  className,
  privacyHref = '/privacy',
  privacyLabel = 'מדיניות פרטיות',
  cookiesHref = '/cookies',
  cookiesLabel = 'מדיניות Cookies',
  message = 'אנחנו משתמשים בעוגיות כדי להפעיל את האתר, למדוד שימוש ולשפר את החוויה. אפשר לאשר הכל, לדחות עוגיות שאינן הכרחיות, או להתאים.',
  categories = DEFAULT_CATEGORIES,
  labels,
}: CookieBannerProps) {
  const [ready, setReady] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [customizing, setCustomizing] = React.useState(false);
  const [prefs, setPrefs] = React.useState<CookieConsentCategories>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  React.useEffect(() => {
    const existing = readCookieConsent();
    if (existing) {
      setPrefs({
        essential: true,
        analytics: existing.analytics,
        marketing: existing.marketing,
      });
      setVisible(false);
    } else {
      setVisible(true);
    }
    setReady(true);

    const onOpen = () => {
      const current = readCookieConsent();
      if (current) {
        setPrefs({
          essential: true,
          analytics: current.analytics,
          marketing: current.marketing,
        });
      }
      setCustomizing(true);
      setVisible(true);
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
  }, []);

  const dismiss = React.useCallback(() => {
    setVisible(false);
    setCustomizing(false);
  }, []);

  const onReject = () => {
    rejectNonEssentialCookieConsent();
    dismiss();
  };

  const onAcceptAll = () => {
    acceptAllCookieConsent();
    dismiss();
  };

  const onSave = () => {
    writeCookieConsent(prefs);
    dismiss();
  };

  if (!ready || !visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="הסכמה לעוגיות"
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out',
            customizing ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-col gap-3 pb-1">
              {categories.map((category) => {
                const locked = category.locked || category.id === 'essential';
                const checked =
                  category.id === 'essential'
                    ? true
                    : prefs[category.id as 'analytics' | 'marketing'];

                return (
                  <li
                    key={category.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-muted/30 px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor={`cookie-${category.id}`}
                        className="text-sm font-semibold text-foreground"
                      >
                        {category.title}
                      </Label>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                    <Switch
                      id={`cookie-${category.id}`}
                      checked={checked}
                      disabled={locked}
                      onCheckedChange={(value) => {
                        if (locked || category.id === 'essential') return;
                        setPrefs((prev) => ({
                          ...prev,
                          [category.id]: value,
                        }));
                      }}
                      aria-label={category.title}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {message}{' '}
            {privacyHref ? (
              <a
                href={privacyHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {privacyLabel}
              </a>
            ) : null}
            {privacyHref && cookiesHref ? (
              <span className="text-muted-foreground"> · </span>
            ) : null}
            {cookiesHref ? (
              <a
                href={cookiesHref}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {cookiesLabel}
              </a>
            ) : null}
          </p>

          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onReject}>
              {labels?.reject ?? 'דחייה'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                customizing ? onSave() : setCustomizing(true)
              }
            >
              {customizing
                ? (labels?.save ?? 'שמירה')
                : (labels?.customize ?? 'התאמה אישית')}
            </Button>
            <Button type="button" size="sm" onClick={onAcceptAll}>
              {labels?.acceptAll ?? 'אישור הכל'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Re-export helpers so apps can open preferences without a deep import. */
export {
  openCookiePreferences,
  hasCookieConsentDecision,
  readCookieConsent,
  canUseAnalytics,
  canUseMarketing,
} from '../../lib/cookie-consent';
