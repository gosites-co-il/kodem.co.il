'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kodem/design-system/components/ui/select';
import { api, isApiError } from '../../lib/api';
import type { Task, TaskStatus } from '../../lib/crm';
import { CRM_TASK_STATUS_LABELS } from '../../lib/crm';
import { CrmShell } from './crm-shell';
import {
  CrmEmpty,
  CrmError,
  CrmLoading,
  CrmStatusBadge,
  CrmSubmitButton,
} from './crm-ui';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  async function load(filter: TaskStatus | 'all' = statusFilter) {
    setLoading(true);
    try {
      const res = await api.listCrmTasks(
        filter === 'all' ? undefined : { status: filter },
      );
      setTasks(res.tasks);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת משימות');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await api.createCrmTask({ title: title.trim() });
      setTitle('');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'יצירת משימה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  async function complete(id: string) {
    setSaving(true);
    try {
      await api.completeCrmTask(id);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'השלמת משימה נכשלה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrmShell title="משימות" description="מעקב אחרי פעולות ומשימות CRM">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">משימה חדשה</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreate}>
              <div className="space-y-1.5">
                <Label htmlFor="task-title">כותרת</Label>
                <Input
                  id="task-title"
                  value={title}
                  required
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <CrmSubmitButton
                saving={saving}
                idleLabel="צור משימה"
                disabled={!title.trim()}
                className="w-full"
              />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
            <CardTitle className="text-base">כל המשימות</CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                const next = value as TaskStatus | 'all';
                setStatusFilter(next);
                void load(next);
              }}
            >
              <SelectTrigger className="w-36" aria-label="סינון לפי סטטוס">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="in_progress">בתהליך</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <CrmLoading label="טוען משימות..." />
            ) : error ? (
              <CrmError message={error} onRetry={() => void load()} />
            ) : tasks.length === 0 ? (
              <CrmEmpty
                title="אין משימות"
                description="צרו משימה חדשה או שנו את הסינון."
              />
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate font-medium">{task.title}</p>
                    <CrmStatusBadge>
                      {CRM_TASK_STATUS_LABELS[task.status]}
                    </CrmStatusBadge>
                  </div>
                  {task.status !== 'completed' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={saving}
                      onClick={() => void complete(task.id)}
                    >
                      השלם
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </CrmShell>
  );
}
