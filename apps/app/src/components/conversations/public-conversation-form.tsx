'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { api, isApiError } from '../../lib/api';

export function PublicConversationForm({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.submitConversationIntake({
        slug,
        name,
        email,
        message,
        utm_source: searchParams.get('utm_source') ?? undefined,
        utm_medium: searchParams.get('utm_medium') ?? undefined,
        utm_campaign: searchParams.get('utm_campaign') ?? undefined,
      });
      setSent(true);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שליחה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-semibold">דברו איתנו</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        השאירו פרטים ונחזור אליכם.
      </p>
      {sent ? (
        <p className="mt-6 text-sm" role="status">
          ההודעה נשלחה. תודה.
        </p>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="name">שם</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">הודעה</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              rows={5}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? 'שולח...' : 'שליחה'}
          </Button>
        </form>
      )}
    </main>
  );
}
