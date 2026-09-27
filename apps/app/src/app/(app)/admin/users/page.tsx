'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminUserListItem } from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kodem/design-system/components/ui/dialog';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kodem/design-system/components/ui/table';
import { api, isApiError } from '../../../../lib/api';
import { useAuth } from '../../../../providers/auth-provider';

type UserForm = {
  name: string;
  email: string;
  password: string;
  platformRole: boolean;
  emailVerified: boolean;
};

const emptyForm = (): UserForm => ({
  name: '',
  email: '',
  password: '',
  platformRole: false,
  emailVerified: true,
});

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<AdminUserListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminUserListItem | null | 'create'>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<AdminUserListItem | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.adminListUsers();
      setRows(data.users);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת המשתמשים נכשלה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm());
    setEditing('create');
  }

  function openEdit(row: AdminUserListItem) {
    setForm({
      name: row.name,
      email: row.email,
      password: '',
      platformRole: row.platformRole === 'super_admin',
      emailVerified: row.emailVerified,
    });
    setEditing(row);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing === 'create') {
        await api.adminCreateUser({
          name: form.name,
          email: form.email,
          password: form.password,
          platformRole: form.platformRole ? 'super_admin' : null,
        });
      } else if (editing) {
        await api.adminUpdateUser(editing.id, {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          platformRole: form.platformRole ? 'super_admin' : null,
          emailVerified: form.emailVerified,
        });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שמירת המשתמש נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminDeleteUser(pendingDelete.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת המשתמש נכשלה');
    } finally {
      setBusy(false);
    }
  }

  const selectableIds = rows
    .filter((row) => row.id !== currentUser?.id)
    .map((row) => row.id);
  const selectedCount = selected.size;
  const allSelectableChecked =
    selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleRow(id: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(selectableIds) : new Set());
  }

  async function confirmBulkDelete() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.adminBulkDeleteUsers([...selected]);
      setSelected((current) => {
        const next = new Set(current);
        for (const id of result.succeeded) next.delete(id);
        return next;
      });
      setBulkDeleteOpen(false);
      if (result.failed.length > 0) {
        setError(result.failed.map((item) => item.message).join(' '));
      }
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת המשתמשים נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">יצירה, עריכה ומחיקה של משתמשים</p>
        <Button type="button" onClick={openCreate}>
          משתמש חדש
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">נבחרו {selectedCount}</span>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={busy}
            onClick={() => setBulkDeleteOpen(true)}
          >
            מחיקה
          </Button>
        </div>
      ) : null}
      {loading ? (
        <p className="text-sm text-muted-foreground">טוען…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין משתמשים.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="בחירת כל המשתמשים"
                  checked={allSelectableChecked}
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </TableHead>
              <TableHead className="text-start">שם</TableHead>
              <TableHead className="text-start">אימייל</TableHead>
              <TableHead className="text-start">תפקיד</TableHead>
              <TableHead className="text-start">סביבות</TableHead>
              <TableHead className="text-start">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const isSelf = row.id === currentUser?.id;
              return (
                <TableRow
                  key={row.id}
                  data-state={selected.has(row.id) ? 'selected' : undefined}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`בחירת ${row.name}`}
                      checked={selected.has(row.id)}
                      disabled={isSelf}
                      onChange={(event) => toggleRow(row.id, event.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell dir="ltr" className="text-start">
                    {row.email}
                  </TableCell>
                  <TableCell>
                    {row.platformRole === 'super_admin' ? 'סופר־אדמין' : 'משתמש'}
                  </TableCell>
                  <TableCell>
                    {row.membershipCount}
                    {row.ownedWorkspaceCount > 0
                      ? ` · בעלים של ${row.ownedWorkspaceCount}`
                      : ''}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(row)}
                      >
                        עריכה
                      </Button>
                      {isSelf ? null : (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => setPendingDelete(row)}
                        >
                          מחיקה
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === 'create' ? 'משתמש חדש' : 'עריכת משתמש'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">שם</Label>
              <Input
                id="user-name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-email">אימייל</Label>
              <Input
                id="user-email"
                type="email"
                dir="ltr"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-password">
                {editing === 'create' ? 'סיסמה' : 'סיסמה חדשה'}
              </Label>
              <Input
                id="user-password"
                type="password"
                dir="ltr"
                required={editing === 'create'}
                minLength={editing === 'create' ? 8 : undefined}
                value={form.password}
                placeholder={editing === 'create' ? undefined : 'השאירו ריק כדי לא לשנות'}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.platformRole}
                onChange={(event) =>
                  setForm({ ...form, platformRole: event.target.checked })
                }
              />
              סופר־אדמין
            </label>
            {editing !== 'create' ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.emailVerified}
                  onChange={(event) =>
                    setForm({ ...form, emailVerified: event.target.checked })
                  }
                />
                אימייל מאומת
              </label>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? 'שומר…' : 'שמירה'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת משתמש</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            למחוק את {pendingDelete?.name} ({pendingDelete?.email})? לא ניתן למחוק
            משתמש שהוא עדיין בעלים של סביבה.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              מחיקה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>מחיקת משתמשים</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            למחוק {selectedCount} משתמשים? משתמש שהוא עדיין בעלים של סביבה יישאר,
            וחשבון המערכת לא יימחק.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void confirmBulkDelete()}
            >
              מחיקה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
