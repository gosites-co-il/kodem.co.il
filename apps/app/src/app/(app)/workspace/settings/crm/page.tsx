'use client';

import { useCallback, useEffect, useId, useState, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronUp, Pencil, Shuffle } from 'lucide-react';
import type {
  CrmContactGroup,
  CrmCustomField,
  CrmCustomFieldType,
  CrmSettings,
  CrmStage,
} from '@kodem/contracts';
import { Button } from '@kodem/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@kodem/design-system/components/ui/sheet';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Switch } from '@kodem/design-system/components/ui/switch';
import { api, isApiError } from '../../../../../lib/api';

const COLORS = [
  '#6366F1',
  '#A855F7',
  '#EC4899',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#3B82F6',
  '#64748B',
];

function newId(): string {
  return crypto.randomUUID();
}

function randomColor(avoid: string): string {
  let next = avoid.toUpperCase();
  while (next === avoid.toUpperCase()) {
    next = `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
      .toUpperCase()}`;
  }
  return next;
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const labelId = useId();
  const current = value.toUpperCase();
  const selectedIndex = COLORS.findIndex((color) => color.toUpperCase() === current);

  function onPaletteKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === 'ArrowLeft' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowRight' || event.key === 'ArrowUp';
    if (!forward && !backward && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const base = selectedIndex < 0 ? 0 : selectedIndex;
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? COLORS.length - 1
          : (base + (forward ? 1 : -1) + COLORS.length) % COLORS.length;
    onChange(COLORS[next]);
    const option = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next];
    option?.focus();
  }

  return (
    <div className="space-y-2">
      <Label id={labelId}>צבע</Label>
      <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center gap-3">
          <span
            className={
              selectedIndex < 0
                ? 'inline-flex size-9 shrink-0 rounded-full ring-2 ring-foreground ring-offset-2 ring-offset-background'
                : 'inline-flex size-9 shrink-0 rounded-full'
            }
            aria-hidden
          >
            <span
              className="size-full rounded-full"
              style={{
                backgroundColor: current,
                boxShadow: 'inset 0 0 0 1px hsl(var(--foreground) / 0.18)',
              }}
            />
          </span>
          <span className="text-sm font-medium tabular-nums tracking-wide" dir="ltr">
            {current}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ms-auto shrink-0"
            onClick={() => onChange(randomColor(current))}
          >
            <Shuffle />
            צבע אקראי
          </Button>
        </div>
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="grid grid-cols-5 justify-items-center gap-y-1"
          onKeyDown={onPaletteKeyDown}
        >
          {COLORS.map((color, index) => {
            const selected = index === selectedIndex;
            return (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={color}
                tabIndex={selected || (selectedIndex < 0 && index === 0) ? 0 : -1}
                className="grid size-8 place-items-center rounded-full hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => onChange(color)}
              >
                <span
                  className="size-5 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: selected
                      ? 'inset 0 0 0 2px #fff, 0 0 0 2px hsl(var(--foreground))'
                      : 'inset 0 0 0 1px hsl(var(--foreground) / 0.16)',
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SettingsCrmPage() {
  const [settings, setSettings] = useState<CrmSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [fieldType, setFieldType] = useState<CrmCustomFieldType>('text');
  const [aiOnly, setAiOnly] = useState(false);
  const [active, setActive] = useState(true);

  const load = useCallback(async () => {
    try {
      setSettings(await api.getCrmSettings());
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'טעינת הגדרות ה־CRM נכשלה');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: CrmSettings) {
    setSaving(true);
    setError(null);
    const previous = settings;
    setSettings(next);
    try {
      setSettings(await api.saveCrmSettings(next));
    } catch (err) {
      setSettings(previous);
      setError(isApiError(err) ? err.message : 'שמירת ההגדרות נכשלה');
    } finally {
      setSaving(false);
    }
  }

  function openStage(stage?: CrmStage) {
    setEditingId(stage?.id ?? null);
    setLabel(stage?.label ?? '');
    setColor(stage?.color ?? COLORS[1]);
    setStageOpen(true);
  }

  function openGroup(group?: CrmContactGroup) {
    setEditingId(group?.id ?? null);
    setLabel(group?.name ?? '');
    setColor(group?.color ?? COLORS[0]);
    setGroupOpen(true);
  }

  function openField(field?: CrmCustomField) {
    setEditingId(field?.id ?? null);
    setLabel(field?.name ?? '');
    setFieldType(field?.type ?? 'text');
    setAiOnly(field?.aiOnly ?? false);
    setActive(field?.active ?? true);
    setFieldOpen(true);
  }

  function moveStage(index: number, direction: -1 | 1) {
    if (!settings) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= settings.stages.length) return;
    const stages = [...settings.stages];
    const [item] = stages.splice(index, 1);
    stages.splice(nextIndex, 0, item);
    void persist({
      ...settings,
      stages: stages.map((stage, position) => ({ ...stage, position })),
    });
  }

  function saveStage(event: React.FormEvent) {
    event.preventDefault();
    if (!settings || !label.trim()) return;
    const stages = editingId
      ? settings.stages.map((stage) =>
          stage.id === editingId
            ? { ...stage, label: label.trim(), color }
            : stage,
        )
      : [
          ...settings.stages,
          {
            id: newId(),
            label: label.trim(),
            color,
            position: settings.stages.length,
          },
        ];
    setStageOpen(false);
    void persist({ ...settings, stages });
  }

  function deleteStage() {
    if (!settings || !editingId || settings.stages.length < 2) return;
    setStageOpen(false);
    void persist({
      ...settings,
      stages: settings.stages
        .filter((stage) => stage.id !== editingId)
        .map((stage, position) => ({ ...stage, position })),
    });
  }

  function saveGroup(event: React.FormEvent) {
    event.preventDefault();
    if (!settings || !label.trim()) return;
    const groups = editingId
      ? settings.groups.map((group) =>
          group.id === editingId
            ? { ...group, name: label.trim(), color }
            : group,
        )
      : [...settings.groups, { id: newId(), name: label.trim(), color }];
    setGroupOpen(false);
    void persist({ ...settings, groups });
  }

  function deleteGroup() {
    if (!settings || !editingId) return;
    setGroupOpen(false);
    void persist({
      ...settings,
      groups: settings.groups.filter((group) => group.id !== editingId),
    });
  }

  function saveField(event: React.FormEvent) {
    event.preventDefault();
    if (!settings || !label.trim()) return;
    const nextField: CrmCustomField = {
      id: editingId ?? newId(),
      name: label.trim(),
      type: fieldType,
      aiOnly,
      active,
    };
    const fields = editingId
      ? settings.fields.map((field) =>
          field.id === editingId ? nextField : field,
        )
      : [...settings.fields, nextField];
    setFieldOpen(false);
    void persist({ ...settings, fields });
  }

  function deleteField() {
    if (!settings || !editingId) return;
    setFieldOpen(false);
    void persist({
      ...settings,
      fields: settings.fields.filter((field) => field.id !== editingId),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold">CRM</h2>
        <p className="max-w-[68ch] text-sm leading-6 text-muted-foreground">
          שלבי המכירה, קבוצות אנשי הקשר והשדות שמופיעים על הכרטיס.
        </p>
      </header>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {!settings ? (
        <p className="text-sm text-muted-foreground">טוען את הגדרות ה־CRM…</p>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-base">שלבי אנשי קשר</CardTitle>
                <CardDescription>
                  הסדר שבו ליד מתקדם, מהפנייה הראשונה ועד לקוח או פסילה.
                </CardDescription>
              </div>
              <Button type="button" size="sm" onClick={() => openStage()} disabled={saving}>
                שלב חדש
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {settings.stages.map((stage, index) => (
                  <li
                    key={stage.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-4 text-xs text-muted-foreground">
                        {index + 1}
                      </span>
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label={`עריכת ${stage.label}`}
                        onClick={() => openStage(stage)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="הזזה למעלה"
                        disabled={saving || index === 0}
                        onClick={() => moveStage(index, -1)}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="הזזה למטה"
                        disabled={saving || index === settings.stages.length - 1}
                        onClick={() => moveStage(index, 1)}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-base">קבוצות אנשי קשר</CardTitle>
                <CardDescription>
                  קבוצות לסימון אנשי קשר, למשל לקוחות, ספקים או VIP.
                </CardDescription>
              </div>
              <Button type="button" size="sm" onClick={() => openGroup()} disabled={saving}>
                קבוצה חדשה
              </Button>
            </CardHeader>
            <CardContent>
              {settings.groups.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  אין קבוצות מוגדרות עדיין.
                </p>
              ) : (
                <ul className="divide-y">
                  {settings.groups.map((group) => (
                    <li
                      key={group.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openGroup(group)}
                      >
                        עריכה
                      </Button>
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {group.name}
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                          aria-hidden
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="space-y-1.5">
                <CardTitle className="text-base">שדות מותאמים</CardTitle>
                <CardDescription>
                  שדות שמופיעים על כרטיס איש הקשר. שדה לסוכן ה־AI לא מוצג למשתמש.
                </CardDescription>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => openField()} disabled={saving}>
                שדה חדש
              </Button>
            </CardHeader>
            <CardContent>
              {settings.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  אין שדות מוגדרים עדיין.
                </p>
              ) : (
                <ul className="divide-y">
                  {settings.fields.map((field) => (
                    <li
                      key={field.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openField(field)}
                      >
                        עריכה
                      </Button>
                      <span className="text-end text-sm">
                        <span className="font-medium">{field.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {field.type === 'number' ? 'מספר' : 'טקסט'}
                          {field.aiOnly ? ' · לסוכן ה־AI' : ''}
                          {field.active ? '' : ' · כבוי'}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Sheet open={stageOpen} onOpenChange={setStageOpen}>
        <SheetContent side="left" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader className="text-start">
            <SheetTitle>{editingId ? 'עריכת שלב' : 'שלב חדש'}</SheetTitle>
            <SheetDescription>השם והצבע שיופיעו ברשימת השלבים.</SheetDescription>
          </SheetHeader>
          <form onSubmit={saveStage} className="flex flex-1 flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage-label">שם השלב</Label>
              <Input
                id="stage-label"
                required
                value={label}
                placeholder="לדוגמה: ליד חדש"
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <ColorPicker value={color} onChange={setColor} />
            <SheetFooter className="mt-auto">
              {editingId ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving || (settings?.stages.length ?? 0) < 2}
                  onClick={deleteStage}
                >
                  מחיקה
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setStageOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving}>
                {editingId ? 'שמירה' : 'יצירה'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={groupOpen} onOpenChange={setGroupOpen}>
        <SheetContent side="left" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader className="text-start">
            <SheetTitle>{editingId ? 'עריכת קבוצה' : 'קבוצה חדשה'}</SheetTitle>
            <SheetDescription>
              קבוצות מסווגות אנשי קשר לנושאים — איש קשר יכול להשתייך למספר קבוצות.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={saveGroup} className="flex flex-1 flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">שם הקבוצה</Label>
              <Input
                id="group-name"
                required
                value={label}
                placeholder='לדוגמה: "לקוחות VIP"'
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <ColorPicker value={color} onChange={setColor} />
            <SheetFooter className="mt-auto">
              {editingId ? (
                <Button type="button" variant="ghost" disabled={saving} onClick={deleteGroup}>
                  מחיקה
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setGroupOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving}>
                {editingId ? 'שמירה' : 'יצירה'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={fieldOpen} onOpenChange={setFieldOpen}>
        <SheetContent side="left" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader className="text-start">
            <SheetTitle>{editingId ? 'עריכת שדה' : 'שדה חדש'}</SheetTitle>
            <SheetDescription>השדה יופיע בכרטיס של איש הקשר.</SheetDescription>
          </SheetHeader>
          <form onSubmit={saveField} className="flex flex-1 flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="field-name">שם השדה</Label>
              <Input
                id="field-name"
                required
                value={label}
                placeholder='לדוגמה: מספר הזמנה'
                onChange={(event) => setLabel(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-type">סוג</Label>
              <select
                id="field-type"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={fieldType}
                onChange={(event) =>
                  setFieldType(event.target.value as CrmCustomFieldType)
                }
              >
                <option value="text">טקסט</option>
                <option value="number">מספר</option>
              </select>
              <p className="text-xs text-muted-foreground">
                טקסט חופשי, או מספר לכמויות ולסכומים.
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Switch
                id="field-ai"
                checked={aiOnly}
                onCheckedChange={setAiOnly}
              />
              <Label htmlFor="field-ai" className="text-sm font-normal leading-5">
                גלוי לסוכן ה־AI בלבד. המסך לא יראה אותו.
              </Label>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Switch
                id="field-active"
                checked={active}
                onCheckedChange={setActive}
              />
              <Label htmlFor="field-active" className="text-sm font-normal leading-5">
                שדה פעיל. מופיע על הכרטיס ואפשר למלא אותו.
              </Label>
            </div>
            <SheetFooter className="mt-auto">
              {editingId ? (
                <Button type="button" variant="ghost" disabled={saving} onClick={deleteField}>
                  מחיקה
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setFieldOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving}>
                {editingId ? 'שמירה' : 'יצירה'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
