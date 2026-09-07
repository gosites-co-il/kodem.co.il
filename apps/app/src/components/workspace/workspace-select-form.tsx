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
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { requiresOnboarding } from '@kodem/contracts';
import { api, isApiError, type WorkspaceListItem } from '../../lib/api';
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
  const [isCreating, setIsCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  async function reloadList() {
    const { workspaces: items } = await api.listWorkspaces();
    setWorkspaces(items);
  }

  useEffect(() => {
    async function load() {
      try {
        const { workspaces: items } = await api.listWorkspaces();
        if (items.length === 0) {
          setError('אין סביבות עבודה זמינות לחשבון זה.');
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
  }, []);

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

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      const result = await api.createWorkspace({
        name: newName.trim() || undefined,
      });
      setSession({
        user: result.user,
        workspace: result.workspace,
        role: result.role,
        token: result.token,
      });
      router.replace(ROUTES.setup);
    } catch (err) {
      setError(
        isApiError(err) ? err.message : 'לא ניתן ליצור סביבת עבודה.',
      );
      setIsCreating(false);
      try {
        await reloadList();
      } catch {
        /* ignore */
      }
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
      description="בחרו סביבה קיימת או הוסיפו לקוח חדש"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">הסביבות שלכם</CardTitle>
          <CardDescription>
            כל סביבה היא לקוח נפרד. סביבות שטרם הושלמו יופיעו עם סטטוס הגדרה.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workspaces.map((item) => {
            const incomplete = requiresOnboarding(item.workspace);
            return (
              <div
                key={item.workspace.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{item.workspace.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {incomplete ? 'הגדרה בתהליך' : item.role}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSelect(item.workspace.id)}
                  disabled={loadingId !== null || isCreating}
                >
                  {loadingId === item.workspace.id
                    ? 'בוחר…'
                    : incomplete
                      ? 'המשך הגדרה'
                      : 'בחר'}
                </Button>
              </div>
            );
          })}

          {showCreate ? (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="space-y-2">
                <Label htmlFor="new-workspace-name">שם לקוח (אופציונלי)</Label>
                <Input
                  id="new-workspace-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="לקוח חדש"
                  disabled={isCreating}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => void handleCreate()}
                  disabled={isCreating || loadingId !== null}
                >
                  {isCreating ? 'יוצרים…' : 'צור והתחל הגדרה'}
                </Button>
                <Button
                  variant="ghost"
                  disabled={isCreating}
                  onClick={() => {
                    setShowCreate(false);
                    setNewName('');
                  }}
                >
                  ביטול
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              disabled={loadingId !== null || isCreating}
              onClick={() => setShowCreate(true)}
            >
              הוסף לקוח / סביבה חדשה
            </Button>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
