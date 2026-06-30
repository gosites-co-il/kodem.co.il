import { Suspense } from 'react';
import { AuthCallbackHandler } from '../../../../components/auth/auth-callback-handler';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Completing sign in…</p>
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
