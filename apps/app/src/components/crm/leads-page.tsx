'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@kodem/design-system/components/ui/card';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { api, isApiError } from '../../lib/api';
import type { Lead } from '../../lib/crm';
import { CRM_LEAD_STATUS_LABELS } from '../../lib/crm';
import { CrmShell } from './crm-shell';
import {
  CrmEmpty,
  CrmError,
  CrmListRow,
  CrmLoading,
  CrmStatusBadge,
  CrmSubmitButton,
} from './crm-ui';

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.listCrmLeads();
      setLeads(res.leads);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת לידים');
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
      await api.createCrmLead({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        source: source.trim() || undefined,
      });
      setName('');
      setEmail('');
      setPhone('');
      setSource('');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'יצירת ליד נכשלה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrmShell title="לידים" description="קליטה, מעקב והמרה לאנשי קשר">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ליד חדש</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreate}>
              <Field
                id="lead-name"
                label="שם"
                value={name}
                onChange={setName}
                required
              />
              <Field
                id="lead-email"
                label="אימייל"
                value={email}
                onChange={setEmail}
                type="email"
              />
              <Field
                id="lead-phone"
                label="טלפון"
                value={phone}
                onChange={setPhone}
              />
              <Field
                id="lead-source"
                label="מקור"
                value={source}
                onChange={setSource}
              />
              <CrmSubmitButton
                saving={saving}
                idleLabel="צור ליד"
                disabled={!name.trim()}
                className="w-full"
              />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">כל הלידים</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <CrmLoading label="טוען לידים..." />
            ) : error ? (
              <CrmError message={error} onRetry={() => void load()} />
            ) : leads.length === 0 ? (
              <CrmEmpty
                title="אין לידים עדיין"
                description="מלאו את הטופס משמאל כדי לקלוט ליד ראשון."
              />
            ) : (
              leads.map((lead) => (
                <CrmListRow
                  key={lead.id}
                  href={`/crm/leads/${lead.id}`}
                  title={lead.name}
                  subtitle={lead.email || lead.phone || lead.source || undefined}
                  meta={
                    <CrmStatusBadge>
                      {CRM_LEAD_STATUS_LABELS[lead.status]}
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

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
