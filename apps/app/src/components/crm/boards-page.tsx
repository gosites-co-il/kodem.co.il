'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CrmBoardPresetId } from '@kodem/contracts';
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
import type { CrmBoard, CrmBoardPresetDefinition } from '../../lib/crm';
import { CRM_PRESET_LABELS } from '../../lib/crm';
import { CrmShell } from './crm-shell';
import {
  CrmEmpty,
  CrmError,
  CrmListRow,
  CrmLoading,
  CrmStatusBadge,
  CrmSubmitButton,
} from './crm-ui';

export function BoardsPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<CrmBoard[]>([]);
  const [presets, setPresets] = useState<CrmBoardPresetDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [preset, setPreset] = useState<CrmBoardPresetId>('sales');

  async function load() {
    setLoading(true);
    try {
      const [boardsRes, presetsRes] = await Promise.all([
        api.listCrmBoards(),
        api.listCrmPresets(),
      ]);
      setBoards(boardsRes.boards);
      setPresets(presetsRes.presets);
      if (
        presetsRes.presets[0] &&
        !presetsRes.presets.find((p) => p.id === preset)
      ) {
        setPreset(presetsRes.presets[0].id);
      }
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת לוחות');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await api.createCrmBoard({
        name: name.trim(),
        preset,
      });
      setName('');
      router.push(`/crm/boards/${res.board.id}`);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'יצירת לוח נכשלה');
      setSaving(false);
    }
  }

  const selectedPreset = presets.find((entry) => entry.id === preset);

  return (
    <CrmShell
      title="לוחות"
      description="לוחות עבודה לפי מצב: מכירות, תמיכה, שירות או הזמנות"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">לוח חדש</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreate}>
              <div className="space-y-1.5">
                <Label htmlFor="board-name">שם</Label>
                <Input
                  id="board-name"
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: מכירות Q1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>מצב</Label>
                <Select
                  value={preset}
                  onValueChange={(value) => setPreset(value as CrmBoardPresetId)}
                >
                  <SelectTrigger aria-label="בחירת מצב לוח">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(presets.length
                      ? presets
                      : (
                          Object.keys(CRM_PRESET_LABELS) as CrmBoardPresetId[]
                        ).map((id) => ({
                          id,
                          label: CRM_PRESET_LABELS[id],
                        }))
                    ).map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPreset ? (
                  <p className="text-xs text-muted-foreground">
                    עמודות: {selectedPreset.columns.map((c) => c.label).join(' · ')}
                  </p>
                ) : null}
              </div>
              <CrmSubmitButton
                saving={saving}
                idleLabel="צור לוח"
                savingLabel="יוצר..."
                disabled={!name.trim()}
                className="w-full"
              />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">כל הלוחות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <CrmLoading label="טוען לוחות..." />
            ) : error ? (
              <CrmError message={error} onRetry={() => void load()} />
            ) : boards.length === 0 ? (
              <CrmEmpty
                title="עדיין אין לוחות"
                description="בחרו מצב וצרו את הלוח הראשון."
              />
            ) : (
              boards.map((board) => (
                <CrmListRow
                  key={board.id}
                  href={`/crm/boards/${board.id}`}
                  title={board.name}
                  meta={
                    <CrmStatusBadge tone="secondary">
                      {CRM_PRESET_LABELS[board.preset]}
                    </CrmStatusBadge>
                  }
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </CrmShell>
  );
}
