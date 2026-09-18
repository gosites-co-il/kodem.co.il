'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LeadStatus } from '@kodem/contracts';
import { LEAD_STATUSES } from '@kodem/contracts';
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
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { api, isApiError } from '../../lib/api';
import type { Lead, Task } from '../../lib/crm';
import {
  CRM_LEAD_STATUS_LABELS,
  CRM_TASK_STATUS_LABELS,
} from '../../lib/crm';
import { CrmShell } from './crm-shell';
import { CrmError, CrmLoading, CrmStatusBadge, CrmSubmitButton } from './crm-ui';

export function LeadDetailPage({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  async function load() {
    try {
      const [leadRes, tasksRes] = await Promise.all([
        api.getCrmLead(leadId),
        api.listCrmTasks({ leadId }),
      ]);
      setLead(leadRes.lead);
      setTasks(tasksRes.tasks);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת הליד');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [leadId]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!lead) return;
    setBusy(true);
    try {
      const res = await api.updateCrmLead(lead.id, {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        notes: lead.notes,
      });
      setLead(res.lead);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שמירה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: LeadStatus) {
    if (!lead) return;
    setBusy(true);
    try {
      const res = await api.changeCrmLeadStatus(lead.id, status);
      setLead(res.lead);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'עדכון סטטוס נכשל');
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    if (!lead) return;
    setBusy(true);
    try {
      const res = await api.convertCrmLead(lead.id);
      setLead(res.lead);
      router.push(`/crm/contacts/${res.contactId}`);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'המרה נכשלה');
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
        leadId,
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
      <CrmShell title="ליד">
        <CrmLoading label="טוען ליד..." />
      </CrmShell>
    );
  }

  if (!lead) {
    return (
      <CrmShell title="ליד">
        <CrmError
          message={error ?? 'הליד לא נמצא'}
          onRetry={() => void load()}
        />
        <Button asChild variant="secondary">
          <Link href="/crm/leads">חזרה ללידים</Link>
        </Button>
      </CrmShell>
    );
  }

  return (
    <CrmShell
      title={lead.name}
      description="פרטי ליד, סטטוס ומשימות מעקב"
      actions={
        <>
          {lead.contactId ? (
            <Button variant="secondary" asChild>
              <Link href={`/crm/contacts/${lead.contactId}`}>איש קשר מקושר</Link>
            </Button>
          ) : (
            <Button onClick={() => void convert()} disabled={busy}>
              המרה לאיש קשר
            </Button>
          )}
        </>
      }
    >
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
                  value={lead.name}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>אימייל</Label>
                <Input
                  value={lead.email ?? ''}
                  onChange={(e) =>
                    setLead({ ...lead, email: e.target.value || undefined })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>טלפון</Label>
                <Input
                  value={lead.phone ?? ''}
                  onChange={(e) =>
                    setLead({ ...lead, phone: e.target.value || undefined })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>מקור</Label>
                <Input
                  value={lead.source ?? ''}
                  onChange={(e) =>
                    setLead({ ...lead, source: e.target.value || undefined })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>הערות</Label>
                <Textarea
                  value={lead.notes ?? ''}
                  onChange={(e) =>
                    setLead({ ...lead, notes: e.target.value || undefined })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>סטטוס</Label>
                <Select
                  value={lead.status}
                  onValueChange={(value) => void changeStatus(value as LeadStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {CRM_LEAD_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <p className="text-sm text-muted-foreground">אין משימות לליד זה.</p>
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
