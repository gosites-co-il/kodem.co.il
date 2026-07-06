'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { api, isApiError, type WorkspaceListItem } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
import { fetchEntryResolution } from '../../lib/entry/entry-flow';
import { useAuth } from '../../providers/auth-provider';
import { AuthShell } from '../auth/auth-shell';

export function WorkspaceSelectForm() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { workspaces: items } = await api.listWorkspaces();
        if (items.length === 0) {
          setError('אין סביבות עבודה זמינות לחשבון זה.');
          return;
        }
        if (items.length === 1) {
          const resolution = await fetchEntryResolution();
          router.replace(resolution.route);
          return;
        }
        setWorkspaces(items);
      } catch (err) {
        setError(
          isApiError(err)
            ? err.message
            : 'לא ניתן לטעון סביבות עבודה.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [router]);

  async function handleSelect(workspaceId: string) {
    setLoadingId(workspaceId);
    setError(null);

    try {
      const result = await api.switchWorkspace(workspaceId);
      setSession({
        user: result.user,
        workspace: result.workspace,
        role: result.role,
        token: result.token,
      });

      const resolution = await api.resolveEntry(true);
      router.replace(resolution.route);
    } catch (err) {
      setError(
        isApiError(err)
          ? err.message
          : 'לא ניתן לבחור סביבת עבודה.',
      );
      setLoadingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">טוען סביבות עבודה…</p>
      </div>
    );
  }

  return (
    <AuthShell
      title="בחירת סביבת עבודה"
      description="בחרו את סביבת העבודה שאליה תיכנסו"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">הסביבות שלכם</CardTitle>
          <CardDescription>
            אתם שייכים למספר סביבות עבודה. בחרו אחת כדי להמשיך.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaces.map((item) => (
            <div
              key={item.workspace.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{item.workspace.name}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {item.role}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => handleSelect(item.workspace.id)}
                disabled={loadingId !== null}
              >
                {loadingId === item.workspace.id ? 'בוחר…' : 'בחר'}
              </Button>
            </div>
          ))}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
