'use client';

import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { useAuth } from '../../providers/auth-provider';

export function DashboardContent() {
  const { user, workspace, role, logout } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform entry — business modules load from here.
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session context</CardTitle>
          <CardDescription>
            Resolved platform context for this request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">User:</span> {user?.name}{' '}
            ({user?.email})
          </p>
          <p>
            <span className="text-muted-foreground">Workspace:</span>{' '}
            {workspace?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Role:</span>{' '}
            <span className="capitalize">{role}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
