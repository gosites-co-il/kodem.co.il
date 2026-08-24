'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { cn } from '@kodem/design-system/lib/utils';
import { getOAuthUrl } from '../../lib/api';
import {
  FacebookIcon,
  GitHubIcon,
  GoogleIcon,
} from './oauth-icons';

export type OAuthProvider = 'google' | 'github' | 'facebook';

const providerConfig: Record<
  OAuthProvider,
  { label: string; Icon: typeof GoogleIcon }
> = {
  google: { label: 'המשך עם Google', Icon: GoogleIcon },
  github: { label: 'המשך עם GitHub', Icon: GitHubIcon },
  facebook: { label: 'המשך עם Facebook', Icon: FacebookIcon },
};

export function OAuthButton({
  provider,
  className,
  label: labelOverride,
}: {
  provider: OAuthProvider;
  className?: string;
  label?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { label: defaultLabel, Icon } = providerConfig[provider];
  const label = labelOverride ?? defaultLabel;

  function handleClick() {
    setIsLoading(true);
    window.location.href = getOAuthUrl(provider);
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isLoading}
      aria-label={label}
      onClick={handleClick}
      className={cn(
        'h-11 w-full rounded-xl border-border/60 bg-card shadow-sm transition-all hover:-translate-y-px hover:border-border hover:shadow-md',
        className,
      )}
    >
      {isLoading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <Icon className="size-5 shrink-0" />
      )}
      <span>{isLoading ? 'מתחבר…' : label}</span>
    </Button>
  );
}
