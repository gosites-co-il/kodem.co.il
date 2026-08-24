import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { ROUTES } from '../../lib/constants';
import { AuthSplitFrame } from './auth-split-frame';

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AuthSplitFrame>
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="space-y-5">
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-0" asChild>
            <Link href={ROUTES.login}>
              <ArrowRight className="size-4" aria-hidden />
              חזרה
            </Link>
          </Button>

          <div className="space-y-3">
            <p className="text-sm font-medium tracking-tight text-muted-foreground">
              Kodem
            </p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
        </div>

        {children}

        {footer ? (
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </AuthSplitFrame>
  );
}
