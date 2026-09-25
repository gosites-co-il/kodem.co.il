'use client';

import { useEffect, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { api, isApiError } from '../../lib/api';
import {
  launchWhatsAppEmbeddedSignup,
  normalizePhoneDigits,
  type WhatsAppNumberStatus,
} from '../../lib/meta/embedded-signup';

export function WhatsAppSignupWizard({
  connectionId,
  canManage,
  onComplete,
  title = 'חבר מספר וואטסאפ',
  description = 'כמה דקות, מודרך דרך Meta — יצירה או קישור של חשבון WhatsApp Business Cloud API.',
}: {
  connectionId?: string;
  canManage: boolean;
  onComplete: () => Promise<void>;
  title?: string;
  description?: string;
}) {
  const [phone, setPhone] = useState('');
  const [numberStatus, setNumberStatus] =
    useState<WhatsAppNumberStatus>('business_app');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localInfo, setLocalInfo] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const cfg = await api.getWhatsAppEmbeddedSignupConfig();
        if (!cancelled) setConfigured(cfg.configured);
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function launch() {
    if (!canManage) return;
    setBusy(true);
    setLocalError(null);
    setLocalInfo(null);
    try {
      const cfg = await api.getWhatsAppEmbeddedSignupConfig();
      if (!cfg.configured || !cfg.appId || !cfg.configId) {
        setLocalError(
          'Embedded Signup לא מוגדר — הגדירו META_WHATSAPP_CLIENT_ID ו-META_WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID',
        );
        return;
      }
      const digits = normalizePhoneDigits(phone);
      const result = await launchWhatsAppEmbeddedSignup({
        appId: cfg.appId,
        configId: cfg.configId,
        graphVersion: cfg.graphVersion,
        coexistence: numberStatus === 'business_app',
        ...(digits
          ? { phoneDigits: digits, phoneCountryCode: 972 }
          : {}),
      });
      const complete = await api.completeWhatsAppEmbeddedSignup({
        code: result.code,
        phoneNumberId: result.session.phoneNumberId,
        wabaId: result.session.wabaId,
        displayPhoneNumber: phone.trim() || undefined,
        connectionId,
      });
      if (!complete.success) {
        setLocalError(complete.message ?? 'השלמת החיבור נכשלה');
        return;
      }
      setLocalInfo(complete.message ?? 'WhatsApp חובר בהצלחה');
      await onComplete();
    } catch (err) {
      setLocalError(
        isApiError(err)
          ? err.message
          : err instanceof Error
            ? err.message
            : 'חיבור WhatsApp נכשל',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <ol className="list-decimal space-y-1 pe-5 text-xs text-muted-foreground">
        <li>נכנסים עם חשבון הפייסבוק הרגיל</li>
        <li>עוקבים אחרי ההנחיות בחלון של Meta</li>
        <li>מאשרים את המספר עם קוד</li>
      </ol>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">מה מספר הוואטסאפ של העסק?</span>
        <Input
          dir="ltr"
          className="font-mono text-sm"
          placeholder="050-0000000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={busy || !canManage}
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">
          מה יש היום על המספר הזה?
        </legend>
        <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent/40">
          <input
            type="radio"
            className="mt-1"
            name="wa-number-status"
            checked={numberStatus === 'business_app'}
            onChange={() => setNumberStatus('business_app')}
            disabled={busy || !canManage}
          />
          <span>
            <span className="font-medium">
              אפליקציית WhatsApp Business (הירוקה)
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              האפליקציה ממשיכה לעבוד; Cloud API מצטרף דרך Meta (Coexistence).
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-accent/40">
          <input
            type="radio"
            className="mt-1"
            name="wa-number-status"
            checked={numberStatus === 'new_or_inactive'}
            onChange={() => setNumberStatus('new_or_inactive')}
            disabled={busy || !canManage}
          />
          <span>
            <span className="font-medium">
              כלום — מספר חדש או לא פעיל בוואטסאפ
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              המספר יחובר ישירות ל-Cloud API וינוהל מהקונסולה.
            </span>
          </span>
        </label>
      </fieldset>
      <p className="text-xs text-muted-foreground">
        יש עליו וואטסאפ רגיל? התקינו קודם את אפליקציית WhatsApp Business
        החינמית, ואז בחרו באפשרות הראשונה.
      </p>
      {configured === false ? (
        <p className="text-sm text-destructive">
          Embedded Signup לא מוגדר בשרת — חסר config id או App ID.
        </p>
      ) : null}
      {localError ? <p className="text-sm text-destructive">{localError}</p> : null}
      {localInfo ? (
        <p className="text-sm text-muted-foreground">{localInfo}</p>
      ) : null}
      <Button
        disabled={!canManage || busy || configured === false}
        onClick={() => void launch()}
      >
        חבר מספר וואטסאפ
      </Button>
      <p className="text-xs text-muted-foreground">
        החיבור רשמי ומאובטח דרך Meta — אפשר להתנתק בכל רגע.
      </p>
    </div>
  );
}
