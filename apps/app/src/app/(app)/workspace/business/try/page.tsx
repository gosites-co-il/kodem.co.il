'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BusinessTryResult } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { api, isApiError } from '../../../../../lib/api';
import { ROUTES } from '../../../../../lib/constants';
import { BusinessTryResultView } from '../../../../../components/business/business-try-result';

export default function BusinessTryPage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [provider, setProvider] = useState<{
    provider: string;
    model: string | null;
    configured: boolean;
    models: string[];
  } | null>(null);
  const [model, setModel] = useState('');
  const [result, setResult] = useState<BusinessTryResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .getBusinessAiStatus()
      .then((status) => {
        setProvider(status);
        setModel(status.model ?? status.models[0] ?? '');
      })
      .catch(() => {
        setError('לא הצלחנו לבדוק את ספק ה-AI. ודאו שה-API רץ.');
      });
  }, []);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const next = await api.tryBusinessWebsite(websiteUrl, model || undefined);
      setResult(next);
      if (next.error) setError(next.error);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'הבדיקה נכשלה.');
    } finally {
      setRunning(false);
    }
  }

  const providerLine = provider
    ? `${provider.provider}${provider.model ? ` · ${provider.model}` : ''} · ${
        provider.configured ? 'מפתח מוגדר' : 'אין מפתח'
      }`
    : error
      ? 'הספק לא נטען'
      : 'טוען ספק…';

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6">
      <header className="space-y-3">
        <p className="text-sm">
          <Link href={ROUTES.workspaceBusiness} className="text-secondary underline-offset-4 hover:underline">
            פרופיל עסקי
          </Link>
        </p>
        {result && !result.error ? null : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">מה ידוע על העסק</h1>
            <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
              בדיקה לפי כתובת האתר. רואים את הפרטים שנאספו, את הנכסים, ואת הקריאה של המנוע. הפרופיל השמור לא משתנה.
            </p>
          </>
        )}
        <p className="text-xs text-muted-foreground">{providerLine}</p>
      </header>

      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          void run();
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="business-website">אתר העסק</Label>
          <Input
            id="business-website"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://"
            type="url"
            required
            disabled={running}
          />
        </div>
        <div className="min-w-0 space-y-2 sm:w-72">
          <Label htmlFor="business-model">מודל</Label>
          <select
            id="business-model"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            disabled={running || !provider?.models.length}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {(provider?.models.length ? provider.models : model ? [model] : []).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={running} className="sm:mb-0">
          {running ? 'בודק…' : 'בדיקה'}
        </Button>
      </form>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {running ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          קוראים את האתר ומכינים את הקריאה.
        </p>
      ) : null}

      {!result && !running ? (
        <p className="max-w-[65ch] text-sm leading-6 text-muted-foreground">
          הזינו את האתר כדי לראות מה כבר ידוע, אילו נכסים נמצאו, ואיך המנוע מתאר את העסק.
        </p>
      ) : null}

      {result && !result.error ? <BusinessTryResultView result={result} /> : null}
    </main>
  );
}
