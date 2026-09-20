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
import {
  SignupLegalConsent,
  storePendingSignupConsent,
  useSignupLegalConsent,
} from './signup-legal-consent';

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const nextParam = searchParams.get('next');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accepted, setAccepted, consents } = useSignupLegalConsent();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!accepted) {
      setError('יש לאשר את תקנון השימוש ומדיניות הפרטיות כדי להמשיך.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await api.register({
        email,
        name,
        password,
        legalConsents: consents,
      });
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
        isApiError(err) ? err.message : 'לא ניתן ליצור חשבון. נסו שוב.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const loginHref = nextParam
    ? `${ROUTES.login}?next=${encodeURIComponent(nextParam)}`
    : ROUTES.login;

  return (
    <AuthShell
      title="יצירת חשבון"
      description="התחילו עם Kodem בתוך דקה"
      showLegal={false}
      footer={
        <>
          כבר יש לכם חשבון?{' '}
          <Link
            href={loginHref}
            className="underline underline-offset-4 hover:text-foreground"
          >
            התחברו
          </Link>
        </>
      }
    >
      <div className="grid gap-4">
        <SignupLegalConsent
          checked={accepted}
          onCheckedChange={setAccepted}
        />

        <OAuthButton
          provider="google"
          label="הירשמו עם Google"
          className={authFieldClasses.buttonOutline}
          disabled={!accepted}
          onBeforeNavigate={() => {
            if (!accepted) {
              setError('יש לאשר את תקנון השימוש ומדיניות הפרטיות כדי להמשיך.');
              return false;
            }
            storePendingSignupConsent();
            return true;
          }}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">
            או
          </span>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="sr-only">
              שם
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="שם מלא"
              autoComplete="name"
              required
              className={authFieldClasses.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
            <Label htmlFor="password" className="sr-only">
              סיסמה
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="סיסמה (לפחות 8 תווים)"
              autoComplete="new-password"
              required
              minLength={8}
              dir="ltr"
              className={authFieldClasses.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : null}
          <Button
            type="submit"
            className={authFieldClasses.button}
            disabled={isSubmitting || !accepted}
          >
            {isSubmitting ? 'יוצר חשבון…' : 'המשך'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
