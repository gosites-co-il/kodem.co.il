'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@kodem/design-system/components/ui/badge';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import type { BusinessProfileDraft, ProfileFieldStatus } from '@kodem/contracts';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupSecondaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

const FIELD_LABELS: Record<string, string> = {
  businessName: 'שם העסק',
  legalName: 'שם משפטי',
  description: 'תיאור',
  industry: 'תחום',
  subIndustry: 'תת-תחום',
  website: 'אתר',
  logo: 'לוגו',
  language: 'שפה',
  emails: 'אימיילים',
  phones: 'טלפונים',
  addresses: 'כתובות',
  socialProfiles: 'רשתות חברתיות',
  services: 'שירותים',
  products: 'מוצרים',
};

function statusLabel(status?: ProfileFieldStatus): string {
  if (status === 'verified') return 'מאומת';
  if (status === 'detected') return 'זוהה';
  return 'חסר';
}

function statusVariant(
  status?: ProfileFieldStatus,
): 'default' | 'secondary' | 'outline' {
  if (status === 'verified') return 'default';
  if (status === 'detected') return 'secondary';
  return 'outline';
}

const EDITABLE_FIELDS = [
  'businessName',
  'legalName',
  'description',
  'industry',
  'subIndustry',
  'website',
  'language',
] as const;

function draftFromState(state: SetupScreenProps['state']): BusinessProfileDraft {
  return (
    state.setup.confirmedProfile ?? {
      businessName: state.setup.business?.name ?? '',
      website: state.setup.business?.websiteUrl,
      industry: state.setup.business?.industry,
      emails: [],
      phones: [],
      addresses: [],
      socialProfiles: [],
      services: [],
      products: [],
      fieldStatus: {},
    }
  );
}

export function BusinessConfirmationScreen({
  state,
  advance,
  isSubmitting,
  error,
  onRefresh,
}: SetupScreenProps) {
  const [draft, setDraft] = useState<BusinessProfileDraft>(() =>
    draftFromState(state),
  );
  const snapshot = state.setup.confirmedProfile ?? state.setup.discovered;
  const [prevSnapshot, setPrevSnapshot] = useState(snapshot);
  if (snapshot !== prevSnapshot) {
    setPrevSnapshot(snapshot);
    setDraft(draftFromState(state));
  }

  const isDiscovering = state.setup.discovered?.status === 'running';
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    void onRefreshRef.current();
  }, []);

  useEffect(() => {
    if (!isDiscovering) return;
    const timer = setInterval(() => {
      void onRefreshRef.current();
    }, 2000);
    return () => clearInterval(timer);
  }, [isDiscovering]);

  function updateField<K extends keyof BusinessProfileDraft>(
    key: K,
    value: BusinessProfileDraft[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      fieldStatus: {
        ...current.fieldStatus,
        [key]: 'verified',
      },
    }));
  }

  function acceptDetected() {
    setDraft((current) => ({
      ...current,
      fieldStatus: Object.fromEntries(
        Object.entries(current.fieldStatus).map(([key, status]) => [
          key,
          status === 'detected' ? 'verified' : status,
        ]),
      ),
    }));
  }

  function renderField(key: string) {
    const status = draft.fieldStatus[key];
    const label = FIELD_LABELS[key] ?? key;
    const value = (draft as unknown as Record<string, unknown>)[key];

    return (
      <div key={key} className="space-y-2 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          <Badge variant={statusVariant(status)}>{statusLabel(status)}</Badge>
        </div>

        {key === 'description' ? (
          <Textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
          />
        ) : EDITABLE_FIELDS.includes(key as (typeof EDITABLE_FIELDS)[number]) ? (
          <Input
            dir={key === 'website' ? 'ltr' : undefined}
            className={key === 'website' ? 'text-start' : undefined}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) =>
              updateField(
                key as keyof BusinessProfileDraft,
                e.target.value as never,
              )
            }
          />
        ) : Array.isArray(value) ? (
          <Input
            dir="ltr"
            className="text-start"
            value={value.join(', ')}
            onChange={(e) =>
              updateField(
                key as keyof BusinessProfileDraft,
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as never,
              )
            }
            placeholder="מופרד בפסיקים"
          />
        ) : key === 'logo' && typeof value === 'string' && value ? (
          <div className="flex items-center gap-3">
            <Image
              src={value}
              alt=""
              width={40}
              height={40}
              unoptimized
              className="size-10 rounded-md border"
            />
            <Input
              dir="ltr"
              className="text-start"
              value={value}
              onChange={(e) => updateField('logo', e.target.value)}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>
    );
  }

  const fieldKeys = Object.keys(FIELD_LABELS);

  return (
    <SetupShell centered={false} className="max-w-2xl">
      <SetupHeadline
        title="זה מה שמצאנו על העסק שלך"
        subtitle={
          isDiscovering
            ? 'עדיין לומדים ברקע — אפשר לערוך ולאשר בכל שלב.'
            : 'אשרו, תקנו או דלגו על מה שחסר.'
        }
      />

      <div className="grid gap-3">
        {fieldKeys.map((key) => renderField(key))}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <SetupSecondaryButton onClick={acceptDetected}>
          אשרו את כל מה שזוהה
        </SetupSecondaryButton>
        <SetupPrimaryButton
          disabled={isSubmitting || !draft.businessName.trim()}
          onClick={() =>
            void advance('business_understanding', { confirmedProfile: draft })
          }
        >
          {isSubmitting ? 'שומר…' : 'אישור והמשך'}
        </SetupPrimaryButton>
      </div>
    </SetupShell>
  );
}
