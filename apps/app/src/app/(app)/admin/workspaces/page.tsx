'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminUserListItem, AdminWorkspaceListItem, PlanId } from '@kodem/contracts';
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
import { ROUTES } from '../../../../lib/constants';
import { useAuth } from '../../../../providers/auth-provider';

const PLAN_OPTIONS: { value: PlanId; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'starter', label: 'Starter' },
  { value: 'growth', label: 'Growth' },
  { value: 'enterprise', label: 'Enterprise' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'פעיל' },
  { value: 'suspended', label: 'מושעה' },
  { value: 'onboarding', label: 'בהקמה' },
  { value: 'deactivated', label: 'מושבת' },
] as const;

const ONBOARDING_OPTIONS = [
  { value: 'NOT_STARTED', label: 'לא התחיל' },
  { value: 'IN_PROGRESS', label: 'בתהליך' },
  { value: 'COMPLETED', label: 'הושלם' },
] as const;

type WorkspaceForm = {
  name: string;
  slug: string;
  websiteUrl: string;
  industry: string;
  businessSize: string;
  status: string;
  onboardingStatus: string;
  ownerEmail: string;
};

const emptyForm = (): WorkspaceForm => ({
  name: '',
  slug: '',
  websiteUrl: '',
  industry: '',
  businessSize: '',
  status: 'active',
  onboardingStatus: 'COMPLETED',
  ownerEmail: '',
});

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [rows, setRows] = useState<AdminWorkspaceListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminWorkspaceListItem | null | 'create'>(
    null,
  );
  const [form, setForm] = useState<WorkspaceForm>(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<AdminWorkspaceListItem | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [transferRow, setTransferRow] = useState<AdminWorkspaceListItem | null>(null);
  const [transferUserId, setTransferUserId] = useState('');
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.adminListWorkspaces();
      setRows(data.workspaces);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הסביבות נכשלה');
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

  function openEdit(row: AdminWorkspaceListItem) {
    setForm({
      name: row.workspace.name,
      slug: row.workspace.slug,
      websiteUrl: row.workspace.websiteUrl ?? '',
      industry: row.workspace.industry ?? '',
      businessSize: row.workspace.businessSize ?? '',
      status: row.workspace.status,
      onboardingStatus: row.workspace.onboardingStatus,
      ownerEmail: row.owner.email,
    });
    setEditing(row);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing === 'create') {
        await api.adminCreateWorkspace({
          name: form.name,
          slug: form.slug || undefined,
          websiteUrl: form.websiteUrl || undefined,
          ownerEmail: form.ownerEmail,
          status: form.status as AdminWorkspaceListItem['workspace']['status'],
          onboardingStatus:
            form.onboardingStatus as AdminWorkspaceListItem['workspace']['onboardingStatus'],
        });
      } else if (editing) {
        await api.adminUpdateWorkspace(editing.workspace.id, {
          name: form.name,
          slug: form.slug,
          websiteUrl: form.websiteUrl,
          industry: form.industry,
          businessSize: form.businessSize,
          status: form.status as AdminWorkspaceListItem['workspace']['status'],
          onboardingStatus:
            form.onboardingStatus as AdminWorkspaceListItem['workspace']['onboardingStatus'],
          ownerEmail: form.ownerEmail,
        });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שמירת הסביבה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminDeleteWorkspace(pendingDelete.workspace.id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת הסביבה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function openTransfer(row: AdminWorkspaceListItem) {
    setTransferRow(row);
    setTransferUserId('');
    setError(null);
    if (users.length > 0) return;
    try {
      const data = await api.adminListUsers();
      setUsers(data.users);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת המשתמשים נכשלה');
    }
  }

  async function confirmTransfer() {
    if (!transferRow || !transferUserId) return;
    setBusy(true);
    setError(null);
    try {
      await api.adminTransferWorkspaceOwner(transferRow.workspace.id, transferUserId);
      setTransferRow(null);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'העברת הבעלות נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function changePlan(id: string, planId: PlanId) {
    setBusy(true);
    setError(null);
    try {
      await api.adminSetWorkspacePlan(id, planId);
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'עדכון התוכנית נכשל');
    } finally {
      setBusy(false);
    }
  }

  async function impersonate(row: AdminWorkspaceListItem) {
    setError(null);
    setBusy(true);
    try {
      const result = await api.adminImpersonateWorkspace(row.workspace.id);
      setSession({
        user: result.user,
        workspace: result.workspace,
        role: result.role,
        token: result.accessToken ?? result.token,
        impersonating: true,
      });
      router.push(ROUTES.dashboard);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'הכניסה לסביבה נכשלה');
      setBusy(false);
    }
  }

  const selectableIds = rows
    .filter((row) => !row.protected)
    .map((row) => row.workspace.id);
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

  function dropSucceeded(ids: string[]) {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of ids) next.delete(id);
      return next;
    });
  }

  async function confirmBulkDelete() {
    setBusy(true);
    setError(null);
    try {
      const result = await api.adminBulkWorkspaces({
        action: 'delete',
        ids: [...selected],
      });
      dropSucceeded(result.succeeded);
      setBulkDeleteOpen(false);
      if (result.failed.length > 0) {
        setError(result.failed.map((item) => item.message).join(' '));
      }
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'מחיקת הסביבות נכשלה');
    } finally {
      setBusy(false);
    }
  }

  async function applyBulkStatus() {
    if (!bulkStatus) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.adminBulkWorkspaces({
        action: 'set_status',
        ids: [...selected],
        status: bulkStatus as AdminWorkspaceListItem['workspace']['status'],
      });
      dropSucceeded(result.succeeded);
      if (result.failed.length > 0) {
        setError(result.failed.map((item) => item.message).join(' '));
      }
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'עדכון הסטטוס נכשל');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          יצירה, עריכה, מחיקה וכניסה לסביבת עבודה
        </p>
        <Button type="button" onClick={openCreate}>
          סביבה חדשה
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="text-sm font-medium">נבחרו {selectedCount}</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value)}
          >
            <option value="">שנה סטטוס</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || !bulkStatus}
            onClick={() => void applyBulkStatus()}
          >
            החלת סטטוס
          </Button>
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
        <p className="text-sm text-muted-foreground">אין סביבות עבודה.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="בחירת כל הסביבות"
                  checked={allSelectableChecked}
                  onChange={(event) => toggleAll(event.target.checked)}
                />
              </TableHead>
              <TableHead className="text-start">שם</TableHead>
              <TableHead className="text-start">מזהה</TableHead>
              <TableHead className="text-start">בעלים</TableHead>
              <TableHead className="text-start">סטטוס</TableHead>
              <TableHead className="text-start">תוכנית</TableHead>
              <TableHead className="text-start">חברים</TableHead>
              <TableHead className="text-start">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.workspace.id}
                data-state={selected.has(row.workspace.id) ? 'selected' : undefined}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`בחירת ${row.workspace.name}`}
                    checked={selected.has(row.workspace.id)}
                    disabled={row.protected}
                    onChange={(event) =>
                      toggleRow(row.workspace.id, event.target.checked)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">{row.workspace.name}</TableCell>
                <TableCell dir="ltr" className="text-start">
                  {row.workspace.slug}
                </TableCell>
                <TableCell>
                  <div className="text-sm">{row.owner.name}</div>
                  <div dir="ltr" className="text-xs text-muted-foreground">
                    {row.owner.email}
                  </div>
                </TableCell>
                <TableCell>
                  {STATUS_OPTIONS.find((option) => option.value === row.workspace.status)
                    ?.label ?? row.workspace.status}
                </TableCell>
                <TableCell>
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={row.planId}
                    disabled={busy}
                    aria-label={`תוכנית ${row.workspace.name}`}
                    onChange={(event) =>
                      void changePlan(row.workspace.id, event.target.value as PlanId)
                    }
                  >
                    {PLAN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>{row.memberCount}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy || row.workspace.status === 'deactivated'}
                      onClick={() => void impersonate(row)}
                    >
                      צפייה
                    </Button>
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={`/admin/workspaces/${row.workspace.id}`}>אנשים</Link>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void openTransfer(row)}
                    >
                      בעלות
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(row)}
                    >
                      עריכה
                    </Button>
                    {row.protected ? null : (
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
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing === 'create' ? 'סביבה חדשה' : 'עריכת סביבה'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="grid gap-3">
            <Field label="שם" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field
              label="מזהה"
              value={form.slug}
              dir="ltr"
              onChange={(slug) => setForm({ ...form, slug })}
              hint={editing === 'create' ? 'אופציונלי. ייווצר מהשם אם יושאר ריק.' : undefined}
            />
            <Field
              label="אימייל בעלים"
              value={form.ownerEmail}
              dir="ltr"
              type="email"
              onChange={(ownerEmail) => setForm({ ...form, ownerEmail })}
              hint="משתמש קיים. אם אין כזה, צרו אותו בלשונית משתמשים."
            />
            <Field
              label="אתר"
              value={form.websiteUrl}
              dir="ltr"
              onChange={(websiteUrl) => setForm({ ...form, websiteUrl })}
            />
            {editing !== 'create' ? (
              <>
                <Field
                  label="תעשייה"
                  value={form.industry}
                  onChange={(industry) => setForm({ ...form, industry })}
                />
                <Field
                  label="גודל העסק"
                  value={form.businessSize}
                  onChange={(businessSize) => setForm({ ...form, businessSize })}
                />
              </>
            ) : null}
            <label className="grid gap-1.5 text-sm">
              <span>סטטוס</span>
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span>הקמה</span>
              <select
                className="h-10 rounded-md border bg-background px-3"
                value={form.onboardingStatus}
                onChange={(event) =>
                  setForm({ ...form, onboardingStatus: event.target.value })
                }
              >
                {ONBOARDING_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
            <DialogTitle>מחיקת סביבה</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            למחוק את {pendingDelete?.workspace.name}? הנתונים של הסביבה יימחקו ולא
            ניתן לשחזר אותם.
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
            <DialogTitle>מחיקת סביבות</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            למחוק {selectedCount} סביבות? כל הנתונים שלהן יימחקו ולא ניתן לשחזר
            אותם. סביבת המערכת לא תימחק.
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

      <Dialog
        open={transferRow !== null}
        onOpenChange={(open) => !open && setTransferRow(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>העברת בעלות</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            הבעלים החדש של {transferRow?.workspace.name} ימונה, והבעלים הקודם
            יהפוך למנהל.
          </p>
          <label className="grid gap-1.5 text-sm">
            <span>בעלים חדש</span>
            <select
              className="h-10 rounded-md border bg-background px-3"
              value={transferUserId}
              onChange={(event) => setTransferUserId(event.target.value)}
            >
              <option value="">בחרו משתמש</option>
              {users
                .filter((user) => user.id !== transferRow?.owner.id)
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
            </select>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setTransferRow(null)}>
              ביטול
            </Button>
            <Button
              type="button"
              disabled={busy || !transferUserId}
              onClick={() => void confirmTransfer()}
            >
              העברה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  dir,
  type = 'text',
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: 'ltr';
  type?: string;
  hint?: string;
}) {
  const id = label;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={label === 'שם' || label === 'אימייל בעלים'}
      />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
