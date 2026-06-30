'use client';

import { Button } from '@kodem/design-system/components/ui/button';
import { getOAuthUrl } from '../../lib/api';

const providers = [
  { id: 'google' as const, label: 'Continue with Google' },
  { id: 'github' as const, label: 'Continue with GitHub' },
  { id: 'facebook' as const, label: 'Continue with Facebook' },
];

export function OAuthButtons() {
  return (
    <div className="grid gap-2">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            window.location.href = getOAuthUrl(provider.id);
          }}
        >
          {provider.label}
        </Button>
      ))}
    </div>
  );
}
