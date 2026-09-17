'use client';

import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';
import { ArrowLeft } from 'lucide-react';

export function WelcomeScreen({ advance, isSubmitting }: SetupScreenProps) {
  return (
    <SetupShell>
      <SetupHeadline
        title="קודם. ואז הכול מסתדר."
        subtitle="ברוכים הבאים ל־Kodem. נקים עבורך את סביבת העבודה של העסק. זה ייקח פחות משתי דקות."
      />
      <SetupPrimaryButton
        disabled={isSubmitting}
        onClick={() => void advance('welcome')}
        icon={ArrowLeft}
      >
        {isSubmitting ? 'מתחיל…' : 'התחל'}
      </SetupPrimaryButton>
    </SetupShell>
  );
}
