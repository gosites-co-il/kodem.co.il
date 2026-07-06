'use client';

import { useEffect, useState } from 'react';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Card, CardContent } from '@kodem/design-system/components/ui/card';
import { api } from '../../../lib/api';
import {
  SetupHeadline,
  SetupPrimaryButton,
  SetupShell,
} from '../setup-shell';
import type { SetupScreenProps } from '../setup-journey';

export function BusinessDiscoveryScreen({
  state,
  advance,
  isSubmitting,
  error,
}: SetupScreenProps) {
  const [name, setName] = useState(state.setup.business?.name ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(
    state.setup.business?.websiteUrl ?? '',
  );
  const [discoveryStarted, setDiscoveryStarted] = useState(false);

  const discovered = state.setup.discovered;
  const isRunning = discovered?.status === 'running';

  useEffect(() => {
    const url = websiteUrl.trim();
    if (!url || url.length < 4 || discoveryStarted) return;

    const timer = setTimeout(() => {
      setDiscoveryStarted(true);
      void api.discoverWebsite(url);
    }, 600);

    return () => clearTimeout(timer);
  }, [websiteUrl, discoveryStarted]);

  return (
    <SetupShell centered={false}>
      <SetupHeadline
        title="בואו נכיר את העסק שלכם"
        subtitle="רק שם ואתר — Kodem ילמד את השאר ברקע."
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
              onChange={(e) => {
                setDiscoveryStarted(false);
                setWebsiteUrl(e.target.value);
              }}
              placeholder="https://example.com"
            />
            {websiteUrl.trim() ? (
              <p className="text-xs text-muted-foreground">
                {isRunning
                  ? 'מגלים מידע על העסק ברקע — אפשר להמשיך בכל זמן.'
                  : 'אם יש אתר, נתחיל ללמוד את העסק מיד.'}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                בלי אתר נמשיך להגדרה ידנית בשלב הבא.
              </p>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <SetupPrimaryButton
            disabled={isSubmitting || !name.trim()}
            onClick={() =>
              void advance('business_discovery', {
                business: {
                  name: name.trim(),
                  websiteUrl: websiteUrl.trim(),
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
