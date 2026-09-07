'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { api, isApiError } from '../../../../lib/api';
import { ROUTES } from '../../../../lib/constants';
import { AuthShell } from '../../../../components/auth/auth-shell';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.requestPasswordReset(email);
      setMessage('אם קיים חשבון עם האימייל הזה, נשלח קישור לאיפוס.');
    } catch (err) {
      setError(isApiError(err) ? err.message : 'הבקשה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.confirmPasswordReset(token, password);
      setMessage('הסיסמה עודכנה. אפשר להתחבר.');
    } catch (err) {
      setError(isApiError(err) ? err.message : 'איפוס הסיסמה נכשל');
    } finally {
      setBusy(false);
    }
  }

  if (token) {
    return (
      <AuthShell
        title="בחירת סיסמה חדשה"
        description="הזינו סיסמה חדשה לחשבון."
        footer={
          <Link
            href={ROUTES.loginEmail}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            חזרה לכניסה
          </Link>
        }
      >
        <form onSubmit={confirmReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה חדשה</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              dir="ltr"
              className="h-11 text-start"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={busy}>
            עדכון סיסמה
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="איפוס סיסמה"
      description="נשלח קישור לאיפוס לאימייל שלכם."
      footer={
        <Link
          href={ROUTES.loginEmail}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          חזרה לכניסה
        </Link>
      }
    >
      <form onSubmit={requestReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">אימייל</Label>
          <Input
            id="email"
            type="email"
            required
            dir="ltr"
            className="h-11 text-start"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          שליחת קישור
        </Button>
      </form>
    </AuthShell>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">טוען…</p>}>
      <ResetForm />
    </Suspense>
  );
}
