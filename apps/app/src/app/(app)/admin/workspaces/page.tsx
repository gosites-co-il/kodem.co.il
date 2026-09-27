'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminWorkspaceListItem } from '@kodem/contracts';
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
      {loading ? (
        <p className="text-sm text-muted-foreground">טוען…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין סביבות עבודה.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">שם</TableHead>
              <TableHead className="text-start">מזהה</TableHead>
              <TableHead className="text-start">בעלים</TableHead>
              <TableHead className="text-start">סטטוס</TableHead>
              <TableHead className="text-start">חברים</TableHead>
              <TableHead className="text-start">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.workspace.id}>
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
                      כניסה
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
