'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { api, isApiError } from '../../lib/api';
import { completeAuthFlow } from '../../lib/auth/session';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { AuthShell } from './auth-shell';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const queryError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await api.login({ email, password });
      const nextRoute = await completeAuthFlow(result);
      setSession({
        user: result.user,
        workspace: result.workspace,
        role: result.role,
        token: result.token,
      });
      router.replace(nextRoute);
    } catch (err) {
      setError(
        isApiError(err) ? err.message : 'לא ניתן להתחבר. נסו שוב.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="כניסה עם אימייל"
      description="הזינו את פרטי החשבון שלכם כדי להמשיך."
      footer={
        <>
          אין לכם חשבון?{' '}
          <Link
            href={ROUTES.register}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            צרו חשבון
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">אימייל</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            className="h-11 text-start"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">סיסמה</Label>
            <Link
              href={ROUTES.loginReset}
              className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              שכחתם סיסמה?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            dir="ltr"
            className="h-11 text-start"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error || queryError ? (
          <p className="text-sm text-destructive">
            {error ??
              (queryError === 'oauth_failed'
                ? 'ההתחברות נכשלה. נסו שוב.'
                : queryError === 'no_workspace'
                  ? 'לא נמצא workspace לחשבון זה.'
                  : 'לא ניתן להתחבר.')}
          </p>
        ) : null}
        <Button
          type="submit"
          className="h-12 w-full rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'מתחבר…' : 'המשך'}
        </Button>
      </form>
    </AuthShell>
  );
}
