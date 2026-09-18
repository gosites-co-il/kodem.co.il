'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kodem/design-system/components/ui/select';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { api, isApiError } from '../../lib/api';
import type {
  Contact,
  CrmBoardDetail,
  CrmBoardItem,
  CrmBoardPresetDefinition,
  Lead,
  Task,
} from '../../lib/crm';
import { CRM_PRESET_LABELS } from '../../lib/crm';
import { CrmShell } from './crm-shell';
import {
  CrmError,
  CrmLoading,
  CrmStatusBadge,
  CrmSubmitButton,
} from './crm-ui';

export function BoardDetailPage({ boardId }: { boardId: string }) {
  const [board, setBoard] = useState<CrmBoardDetail | null>(null);
  const [preset, setPreset] = useState<CrmBoardPresetDefinition | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [contactId, setContactId] = useState('');
  const [taskId, setTaskId] = useState('');

  const suggested = useMemo(
    () => new Set(preset?.suggestedLinks ?? []),
    [preset],
  );

  async function load() {
    setLoading(true);
    try {
      const [boardRes, presetsRes, leadsRes, contactsRes, tasksRes] =
        await Promise.all([
          api.getCrmBoard(boardId),
          api.listCrmPresets(),
          api.listCrmLeads(),
          api.listCrmContacts(),
          api.listCrmTasks(),
        ]);
      setBoard(boardRes.board);
      setPreset(
        presetsRes.presets.find((p) => p.id === boardRes.board.preset) ?? null,
      );
      setLeads(leadsRes.leads);
      setContacts(contactsRes.contacts);
      setTasks(tasksRes.tasks);
      setColumnId((current) => current || boardRes.board.columns[0]?.id || '');
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת הלוח');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [boardId]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !board) return;
    setBusy(true);
    try {
      await api.createCrmBoardItem(board.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        columnId: columnId || undefined,
        leadId: leadId || undefined,
        contactId: contactId || undefined,
        taskId: taskId || undefined,
      });
      setTitle('');
      setDescription('');
      setLeadId('');
      setContactId('');
      setTaskId('');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'יצירת כרטיס נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function moveItem(item: CrmBoardItem, nextColumnId: string) {
    if (!board || nextColumnId === item.columnId) return;
    setBusy(true);
    try {
      await api.updateCrmBoardItem(board.id, item.id, {
        columnId: nextColumnId,
      });
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'העברת כרטיס נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(itemId: string) {
    if (!board) return;
    setBusy(true);
    try {
      await api.deleteCrmBoardItem(board.id, itemId);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת כרטיס נכשלה');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <CrmShell title="לוח">
        <CrmLoading label="טוען לוח..." />
      </CrmShell>
    );
  }

  if (!board) {
    return (
      <CrmShell title="לוח">
        <CrmError
          message={error ?? 'הלוח לא נמצא'}
          onRetry={() => void load()}
        />
        <Button asChild variant="secondary">
          <Link href="/crm/boards">חזרה ללוחות</Link>
        </Button>
      </CrmShell>
    );
  }

  const itemsByColumn = new Map<string, CrmBoardItem[]>();
  for (const column of board.columns) {
    itemsByColumn.set(column.id, []);
  }
  for (const item of board.items) {
    const list = itemsByColumn.get(item.columnId) ?? [];
    list.push(item);
    itemsByColumn.set(item.columnId, list);
  }

  return (
    <CrmShell
      title={board.name}
      description={`${CRM_PRESET_LABELS[board.preset]} · העבירו כרטיסים בין עמודות`}
      actions={
        <Button variant="secondary" asChild>
          <Link href="/crm/boards">כל הלוחות</Link>
        </Button>
      }
    >
      {error ? (
        <CrmError message={error} onRetry={() => void load()} />
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">כרטיס חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
            onSubmit={onCreate}
          >
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <Label htmlFor="card-title">כותרת</Label>
              <Input
                id="card-title"
                value={title}
                required
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>עמודה</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger aria-label="עמודה לכרטיס חדש">
                  <SelectValue placeholder="בחרו עמודה" />
                </SelectTrigger>
                <SelectContent>
                  {board.columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <Label htmlFor="card-description">תיאור</Label>
              <Textarea
                id="card-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {(suggested.has('lead') || suggested.size === 0) && (
              <LinkedSelect
                label="ליד מקושר"
                value={leadId}
                onChange={setLeadId}
                options={leads.map((lead) => ({
                  id: lead.id,
                  label: lead.name,
                }))}
              />
            )}
            {(suggested.has('contact') || suggested.size === 0) && (
              <LinkedSelect
                label="איש קשר מקושר"
                value={contactId}
                onChange={setContactId}
                options={contacts.map((contact) => ({
                  id: contact.id,
                  label: contact.name,
                }))}
              />
            )}
            {(suggested.has('task') || suggested.size === 0) && (
              <LinkedSelect
                label="משימה מקושרת"
                value={taskId}
                onChange={setTaskId}
                options={tasks.map((task) => ({
                  id: task.id,
                  label: task.title,
                }))}
              />
            )}
            <div className="flex items-end md:col-span-2 lg:col-span-3">
              <CrmSubmitButton
                saving={busy}
                idleLabel="הוסף כרטיס"
                savingLabel="מוסיף..."
                disabled={!title.trim()}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {board.columns.map((column) => {
          const items = itemsByColumn.get(column.id) ?? [];
          return (
            <section
              key={column.id}
              className="flex w-72 shrink-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3"
              aria-label={column.label}
            >
              <header className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </header>
              <div className="flex min-h-24 flex-col gap-2">
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                    אין כרטיסים
                  </p>
                ) : (
                  items.map((item) => (
                    <article
                      key={item.id}
                      className="space-y-2 rounded-md border bg-card p-3 text-sm"
                    >
                      <p className="font-medium leading-snug">{item.title}</p>
                      {item.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-1">
                        {item.leadId ? (
                          <LinkChip
                            href={`/crm/leads/${item.leadId}`}
                            label="ליד"
                          />
                        ) : null}
                        {item.contactId ? (
                          <LinkChip
                            href={`/crm/contacts/${item.contactId}`}
                            label="איש קשר"
                          />
                        ) : null}
                        {item.taskId ? (
                          <CrmStatusBadge>משימה</CrmStatusBadge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={item.columnId}
                          onValueChange={(value) => void moveItem(item, value)}
                          disabled={busy}
                        >
                          <SelectTrigger
                            className="h-9 flex-1 text-xs"
                            aria-label={`העברת ${item.title}`}
                          >
                            <SelectValue placeholder="העבר ל..." />
                          </SelectTrigger>
                          <SelectContent>
                            {board.columns.map((target) => (
                              <SelectItem key={target.id} value={target.id}>
                                {target.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => void deleteItem(item.id)}
                          aria-label={`מחק ${item.title}`}
                        >
                          מחק
                        </Button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </CrmShell>
  );
}

function LinkedSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value || '__none__'}
        onValueChange={(next) => onChange(next === '__none__' ? '' : next)}
      >
        <SelectTrigger>
          <SelectValue placeholder="ללא" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">ללא</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LinkChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </Link>
  );
}
