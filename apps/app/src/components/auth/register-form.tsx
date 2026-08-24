'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { api, isApiError } from '../../lib/api';
import { completeAuthFlow } from '../../lib/auth/session';
import { ROUTES } from '../../lib/constants';
import { useAuth } from '../../providers/auth-provider';
import { AuthShell } from './auth-shell';

export function RegisterForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await api.register({ email, name, password });
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
        isApiError(err) ? err.message : 'לא ניתן ליצור חשבון. נסו שוב.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="יצירת חשבון"
      description="התחילו עם workspace חדש ב-Kodem."
      footer={
        <>
          כבר יש לכם חשבון?{' '}
          <Link
            href={ROUTES.login}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            התחברו
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            className="h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
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
          <Label htmlFor="password">סיסמה</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            dir="ltr"
            className="h-11 text-start"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button
          type="submit"
          className="h-12 w-full rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'יוצר חשבון…' : 'צרו חשבון'}
        </Button>
      </form>
    </AuthShell>
  );
}
