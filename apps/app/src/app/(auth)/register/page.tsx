import { Suspense } from 'react';
import { RegisterForm } from '../../../components/auth/register-form';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          טוען…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
