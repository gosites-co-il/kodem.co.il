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
import type { Contact } from '../../lib/crm';
import { CrmShell } from './crm-shell';
import {
  CrmEmpty,
  CrmError,
  CrmListRow,
  CrmLoading,
  CrmSubmitButton,
} from './crm-ui';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.listCrmContacts();
      setContacts(res.contacts);
      setError(null);
    } catch (err) {
      setError(isApiError(err) ? err.message : 'שגיאה בטעינת אנשי קשר');
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
      await api.createCrmContact({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      setName('');
      setEmail('');
      setPhone('');
      await load();
    } catch (err) {
      setError(isApiError(err) ? err.message : 'יצירת איש קשר נכשלה');
    } finally {
      setSaving(false);
    }
  }

  return (
    <CrmShell title="אנשי קשר" description="אנשים שהעסק מכיר ועובד איתם">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">איש קשר חדש</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={onCreate}>
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">שם</Label>
                <Input
                  id="contact-name"
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-email">אימייל</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone">טלפון</Label>
                <Input
                  id="contact-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <CrmSubmitButton
                saving={saving}
                idleLabel="צור איש קשר"
                disabled={!name.trim()}
                className="w-full"
              />
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">כל אנשי הקשר</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <CrmLoading label="טוען אנשי קשר..." />
            ) : error ? (
              <CrmError message={error} onRetry={() => void load()} />
            ) : contacts.length === 0 ? (
              <CrmEmpty
                title="אין אנשי קשר עדיין"
                description="הוסיפו איש קשר ידנית או המירו ליד מוסמך."
              />
            ) : (
              contacts.map((contact) => (
                <CrmListRow
                  key={contact.id}
                  href={`/crm/contacts/${contact.id}`}
                  title={contact.name}
                  subtitle={contact.email || contact.phone || undefined}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </CrmShell>
  );
}
