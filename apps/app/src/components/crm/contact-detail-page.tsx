'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { api, isApiError } from '../../lib/api';
import type { Contact, Task } from '../../lib/crm';
import { CRM_TASK_STATUS_LABELS } from '../../lib/crm';
import { CrmShell } from './crm-shell';
import { CrmError, CrmLoading, CrmStatusBadge, CrmSubmitButton } from './crm-ui';

export function ContactDetailPage({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  async function load() {
    try {
      const [contactRes, tasksRes] = await Promise.all([
        api.getCrmContact(contactId),
        api.listCrmTasks({ contactId }),
      ]);
      setContact(contactRes.contact);
      setTasks(tasksRes.tasks);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת איש הקשר');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [contactId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!contact) return;
    setBusy(true);
    try {
      const res = await api.updateCrmContact(contact.id, {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
      });
      setContact(res.contact);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שמירה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    setBusy(true);
    try {
      await api.createCrmTask({
        title: taskTitle.trim(),
        contactId,
      });
      setTaskTitle('');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'יצירת משימה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function completeTask(id: string) {
    setBusy(true);
    try {
      await api.completeCrmTask(id);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'השלמת משימה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <CrmShell title="איש קשר">
        <CrmLoading label="טוען איש קשר..." />
      </CrmShell>
    );
  }

  if (!contact) {
    return (
      <CrmShell title="איש קשר">
        <CrmError
          message={error ?? 'איש הקשר לא נמצא'}
          onRetry={() => void load()}
        />
        <Button asChild variant="secondary">
          <Link href="/crm/contacts">חזרה לאנשי קשר</Link>
        </Button>
      </CrmShell>
    );
  }

  return (
    <CrmShell title={contact.name} description="פרטי איש קשר ומשימות מעקב">
      {error ? (
        <CrmError message={error} onRetry={() => void load()} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">פרטים</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={save}>
              <div className="space-y-1.5">
                <Label>שם</Label>
                <Input
                  value={contact.name}
                  onChange={(e) =>
                    setContact({ ...contact, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>אימייל</Label>
                <Input
                  value={contact.email ?? ''}
                  onChange={(e) =>
                    setContact({
                      ...contact,
                      email: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>טלפון</Label>
                <Input
                  value={contact.phone ?? ''}
                  onChange={(e) =>
                    setContact({
                      ...contact,
                      phone: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>הערות</Label>
                <Textarea
                  value={contact.notes ?? ''}
                  onChange={(e) =>
                    setContact({
                      ...contact,
                      notes: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <CrmSubmitButton saving={busy} idleLabel="שמור שינויים" />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">משימות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="flex gap-2" onSubmit={addTask}>
              <Input
                placeholder="משימת מעקב חדשה"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                aria-label="כותרת משימה חדשה"
              />
              <Button type="submit" disabled={busy || !taskTitle.trim()}>
                הוסף
              </Button>
            </form>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                אין משימות לאיש קשר זה.
              </p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{task.title}</p>
                      <CrmStatusBadge>
                        {CRM_TASK_STATUS_LABELS[task.status]}
                      </CrmStatusBadge>
                    </div>
                    {task.status !== 'completed' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void completeTask(task.id)}
                      >
                        השלם
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CrmShell>
  );
}
