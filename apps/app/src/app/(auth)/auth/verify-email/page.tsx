'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { api, isApiError } from '../../../../lib/api';
import { ROUTES } from '../../../../lib/constants';
import { useAuth } from '../../../../providers/auth-provider';

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [message, setMessage] = useState('מאמתים אימייל…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('חסר אסימון אימות.');
      return;
    }
    void api
      .verifyEmail(token)
      .then(() => {
        setStatus('ok');
        setMessage('האימייל אומת בהצלחה.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(isApiError(err) ? err.message : 'אימות האימייל נכשל');
      });
  }, [token]);

  async function resend() {
    try {
      await api.resendVerifyEmail();
      setMessage('נשלח מייל אימות חדש.');
      setStatus('ok');
    } catch (err) {
      setStatus('error');
      setMessage(isApiError(err) ? err.message : 'שליחה מחדש נכשלה');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>אימות אימייל</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === 'ok' ? (
            <Button asChild className="w-full">
              <Link href={ROUTES.entry}>המשך</Link>
            </Button>
          ) : null}
          {status === 'error' && isAuthenticated ? (
            <Button className="w-full" variant="secondary" onClick={() => void resend()}>
              שליחה מחדש
            </Button>
          ) : null}
          <Button asChild variant="ghost" className="w-full">
            <Link href={ROUTES.login}>חזרה לכניסה</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">טוען…</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
