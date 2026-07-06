'use client';

import { useEffect, useState } from 'react';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kodem/design-system/components/ui/select';
import { Card, CardContent } from '@kodem/design-system/components/ui/card';
import { api } from '../../../lib/api';
import {
  BUSINESS_SIZE_OPTIONS,
  INDUSTRY_OPTIONS,
} from '../../../lib/setup/constants';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function BusinessScreen({
  state,
  advance,
  isSubmitting,
  error,
  onRefresh,
}: SetupScreenProps) {
  const [name, setName] = useState(state.setup.business?.name ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(
    state.setup.business?.websiteUrl ?? '',
  );
  const [industry, setIndustry] = useState(state.setup.business?.industry ?? '');
  const [businessSize, setBusinessSize] = useState(
    state.setup.business?.businessSize ?? '',
  );
  const [isDiscovering, setIsDiscovering] = useState(false);

  const discovered = state.setup.discovered;

  useEffect(() => {
    const url = websiteUrl.trim();
    if (!url || url.length < 4) return;

    const timer = setTimeout(() => {
      setIsDiscovering(true);
      void api
        .discoverWebsite(url)
        .then(() => onRefresh())
        .finally(() => setIsDiscovering(false));
    }, 600);

    return () => clearTimeout(timer);
  }, [websiteUrl, onRefresh]);

  useEffect(() => {
    if (discovered?.name && !name) setName(discovered.name);
    if (discovered?.industry && !industry) setIndustry(discovered.industry);
  }, [discovered, name, industry]);

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="העסק שלך"
        subtitle="ספרו לנו קצת — או תנו לנו לגלות בעצמנו."
      />

      <Card className="border shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="business-name">שם העסק</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: קודם בע״מ"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">אתר (אופציונלי)</Label>
            <Input
              id="website"
              dir="ltr"
              className="text-start"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
            {isDiscovering ? (
              <p className="text-xs text-muted-foreground">סורקים את האתר…</p>
            ) : null}
          </div>

          {discovered?.status === 'completed' ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm space-y-2">
              <p className="font-medium">מה שמצאנו</p>
              {discovered.description ? (
                <p className="text-muted-foreground">{discovered.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs">
                {discovered.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={discovered.logoUrl}
                    alt=""
                    className="size-8 rounded"
                  />
                ) : null}
                {discovered.email ? (
                  <span className="rounded-full bg-background px-2 py-1" dir="ltr">
                    {discovered.email}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>תחום פעילות</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="בחרו תחום" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>גודל העסק (אופציונלי)</Label>
            <Select value={businessSize} onValueChange={setBusinessSize}>
              <SelectTrigger>
                <SelectValue placeholder="בחרו גודל" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <SetupPrimaryButton
            disabled={isSubmitting || !name.trim() || !industry}
            onClick={() =>
              void advance('business', {
                business: {
                  name: name.trim(),
                  websiteUrl: websiteUrl.trim(),
                  industry,
                  businessSize,
                },
              })
            }
          >
            {isSubmitting ? 'שומר…' : 'המשך'}
          </SetupPrimaryButton>
        </CardContent>
      </Card>
    </SetupShell>
  );
}
