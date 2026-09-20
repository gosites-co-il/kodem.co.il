import Link from 'next/link';
import { ROUTES } from '../../lib/constants';
import { AuthSplitFrame } from './auth-split-frame';

const pillInputClass =
  'h-12 rounded-full border-0 bg-muted px-5 text-start shadow-none focus-visible:ring-2 focus-visible:ring-ring';

const pillButtonClass = 'h-12 w-full rounded-full text-base font-medium';

export const authFieldClasses = {
  input: pillInputClass,
  button: pillButtonClass,
  buttonOutline:
    'h-12 w-full rounded-full border-border bg-background text-base font-medium shadow-none hover:bg-muted/60',
};

/** Shared signup10 shell for email forms, reset, and invites. */
export function AuthShell({
  title,
  description,
  children,
  footer,
  showLegal = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showLegal?: boolean;
}) {
  return (
    <AuthSplitFrame>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-balance text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        {children}

        {showLegal ? (
          <p className="px-2 text-center text-xs text-muted-foreground">
            ניתן לעיין ב־
            <Link
              href={ROUTES.terms}
              className="underline underline-offset-4 hover:text-foreground"
            >
              תקנון השימוש
            </Link>{' '}
            וב־
            <Link
              href={ROUTES.privacy}
              className="underline underline-offset-4 hover:text-foreground"
            >
              מדיניות הפרטיות
            </Link>
            .
          </p>
        ) : null}

        {footer ? (
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </AuthSplitFrame>
  );
}
