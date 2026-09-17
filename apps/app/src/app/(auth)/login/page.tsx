import { Suspense } from 'react';
import { LoginForm } from '../../../components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center text-muted-foreground">
          טוען…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
