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
import { api, ApiError, type WorkspaceListItem } from '../../lib/api';
import { ROUTES } from '../../lib/constants';
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
          setError('No workspaces available for this account.');
          return;
        }
        if (items.length === 1) {
          router.replace(ROUTES.dashboard);
          return;
        }
        setWorkspaces(items);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to load workspaces.',
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
      router.replace(ROUTES.dashboard);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to switch workspace.',
      );
      setLoadingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading workspaces…</p>
      </div>
    );
  }

  return (
    <AuthShell
      title="Choose workspace"
      description="Select the workspace you want to enter"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your workspaces</CardTitle>
          <CardDescription>
            You belong to multiple workspaces. Pick one to continue.
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
                {loadingId === item.workspace.id ? 'Selecting…' : 'Select'}
              </Button>
            </div>
          ))}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
