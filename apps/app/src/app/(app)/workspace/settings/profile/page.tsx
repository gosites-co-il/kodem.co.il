'use client';

import { useAuth } from '../../../../../providers/auth-provider';

export default function SettingsProfilePage() {
  const { user } = useAuth();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">פרופיל</h2>
      <div className="space-y-1">
        <p className="text-sm font-medium">שם</p>
        <p className="text-sm text-muted-foreground">{user?.name || '—'}</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">אימייל</p>
        <p className="text-sm text-muted-foreground" dir="ltr">
          {user?.email || '—'}
        </p>
      </div>
    </section>
  );
}
