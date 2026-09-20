'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Checkbox } from '@kodem/design-system/components/ui/checkbox';
import { Label } from '@kodem/design-system/components/ui/label';
import { getRequiredSignupConsents } from '@kodem/platform/legal';
import type { LegalConsentAcceptanceInput } from '@kodem/contracts';
import { ROUTES } from '../../lib/constants';

const PENDING_CONSENT_KEY = 'kodem_pending_legal_consent';

export function buildSignupLegalConsents(): LegalConsentAcceptanceInput[] {
  return getRequiredSignupConsents();
}

export function storePendingSignupConsent(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(
    PENDING_CONSENT_KEY,
    JSON.stringify({
      consents: buildSignupLegalConsents(),
      source: 'OAUTH_SIGNUP',
      savedAt: Date.now(),
    }),
  );
}

export function readPendingSignupConsent(): {
  consents: LegalConsentAcceptanceInput[];
  source: 'OAUTH_SIGNUP';
} | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(PENDING_CONSENT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      consents?: LegalConsentAcceptanceInput[];
      source?: 'OAUTH_SIGNUP';
    };
    if (!parsed.consents?.length) return null;
    return {
      consents: parsed.consents,
      source: 'OAUTH_SIGNUP',
    };
  } catch {
    return null;
  }
}

export function clearPendingSignupConsent(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PENDING_CONSENT_KEY);
}

export function SignupLegalConsent({
  checked,
  onCheckedChange,
  id = 'signup-legal-consent',
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm leading-relaxed font-normal text-muted-foreground"
      >
        אני מאשר/ת את{' '}
        <Link
          href={ROUTES.terms}
          target="_blank"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={(event) => event.stopPropagation()}
        >
          תקנון השימוש
        </Link>{' '}
        ואת{' '}
        <Link
          href={ROUTES.privacy}
          target="_blank"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={(event) => event.stopPropagation()}
        >
          מדיניות הפרטיות
        </Link>{' '}
        של Kodem.
      </Label>
    </div>
  );
}

export function useSignupLegalConsent() {
  const [accepted, setAccepted] = useState(false);
  return {
    accepted,
    setAccepted,
    consents: buildSignupLegalConsents(),
  };
}
