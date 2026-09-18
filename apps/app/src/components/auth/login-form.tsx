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
import { AuthShell, authFieldClasses } from './auth-shell';
import { OAuthButton } from './oauth-button';

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
      const nextParam = searchParams.get('next');
      const nextRoute = await completeAuthFlow(result, { next: nextParam });
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

  const registerHref = (() => {
    const next = searchParams.get('next');
    return next
      ? `${ROUTES.register}?next=${encodeURIComponent(next)}`
      : ROUTES.register;
  })();

  return (
    <AuthShell
      title="כניסה לחשבון"
      description="התחברו או הרשמו על מנת להמשיך"
      footer={
        <>
          אין לכם חשבון?{' '}
          <Link
            href={registerHref}
            className="underline underline-offset-4 hover:text-foreground"
          >
            הירשמו
          </Link>
        </>
      }
    >
      <div className="grid gap-4">
        <OAuthButton
          provider="google"
          label="המשך עם Google"
          className={authFieldClasses.buttonOutline}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            או
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className="sr-only">
              אימייל
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              required
              dir="ltr"
              className={authFieldClasses.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <Label htmlFor="password" className="sr-only">
                סיסמה
              </Label>
              <Link
                href={ROUTES.loginReset}
                className="ms-auto text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                שכחתם סיסמה?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="סיסמה"
              autoComplete="current-password"
              required
              dir="ltr"
              className={authFieldClasses.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error || queryError ? (
            <p className="text-center text-sm text-destructive">
              {error ??
                (queryError === 'oauth_failed'
                  ? 'ההתחברות נכשלה. נסו שוב.'
                  : queryError === 'oauth_db'
                    ? 'השרת לא מצליח להתחבר למסד הנתונים. בדקו ש־Postgres רץ ונסקו שוב.'
                    : queryError === 'no_workspace'
                      ? 'לא נמצא workspace לחשבון זה.'
                      : 'לא ניתן להתחבר.')}
            </p>
          ) : null}
          <Button
            type="submit"
            className={authFieldClasses.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'מתחבר…' : 'המשך'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
