import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kodem/design-system/components/ui/select';
import { getWhatsAppUrl, SECONDARY_CTA_LABEL } from '../../lib/site-config';
import { isValidIsraeliPhone, normalizePhone } from '../../lib/lead-capture';
import { track } from '../../lib/analytics';

/** Channel / stack marks — product integrations, not fabricated customer logos. */
const CHANNEL_MARKS = [
  'WhatsApp',
  'Meta',
  'Facebook',
  'Instagram',
  'Google',
  'CRM',
  'Calendar',
  'Sheets',
] as const;

const PROCESS_STEPS = [
  'שיחת היכרות קצרה — בודקים התאמה לעסק שלך',
  'מחשבים יחד כמה לידים נשרפים היום',
  'אם זה מתאים — מתחילים הקמה מלווה',
] as const;

const BUDGET_OPTIONS = [
  { value: 'under-500', label: 'עד ₪500 לחודש' },
  { value: '500-1000', label: '₪500–1,000 לחודש' },
  { value: '1000-2000', label: '₪1,000–2,000 לחודש' },
  { value: 'over-2000', label: 'מעל ₪2,000 לחודש' },
  { value: 'unsure', label: 'עדיין לא בטוח' },
] as const;

/**
 * Contact layout inspired by shadcnblocks Contact 17:
 * https://www.shadcnblocks.com/block/contact17
 * Adapted for Hebrew RTL + KODEM (phone-first, no fabricated logos).
 */
export function ContactPage() {
  const wa = getWhatsAppUrl('היי KODEM, אשמח לשיחת היכרות');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState<string | undefined>();
  const [message, setMessage] = useState('');
  const [referrer, setReferrer] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName || !isValidIsraeliPhone(phone)) {
      setStatus('error');
      setError('הזן שם וטלפון נייד ישראלי תקין.');
      return;
    }

    const budgetLabel =
      BUDGET_OPTIONS.find((o) => o.value === budget)?.label ?? 'לא צוין';
    const text = [
      `שם: ${fullName}`,
      `טלפון: ${normalizePhone(phone)}`,
      `תקציב משוער: ${budgetLabel}`,
      referrer.trim() ? `איך הגעת: ${referrer.trim()}` : null,
      message.trim() || null,
    ]
      .filter(Boolean)
      .join('\n');

    track('lead_form_submitted', {
      source: 'contact',
      budget: budget ?? 'unset',
    });

    const phoneDigits =
      (import.meta.env.PUBLIC_WHATSAPP_PHONE as string | undefined)?.replace(
        /\D/g,
        '',
      ) ?? '';

    if (phoneDigits) {
      window.open(
        `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`,
        '_blank',
        'noopener,noreferrer',
      );
      setStatus('ok');
      setError(null);
      return;
    }

    setStatus('error');
    setError(
      'טופס יצירת הקשר מוכן. הגדר PUBLIC_WHATSAPP_PHONE או נקודת קצה לידים כדי לשלוח.',
    );
  };

  return (
    <section className="section-pad bg-muted/40">
      <div className="container-site">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Proof / process column — first on mobile */}
          <div className="reveal space-y-8">
            <div>
              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                נדבר במספרים.
                <br />
                בלי לחץ.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                שיחת היכרות קצרה — בודקים אם KODEM מתאים לעסק שלך לפני שקל.
              </p>
            </div>

            <ul className="space-y-4">
              {PROCESS_STEPS.map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--glow))]/20 text-[hsl(var(--trust))]">
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="pt-1 text-sm leading-relaxed text-foreground sm:text-base">
                    {step}
                  </span>
                </li>
              ))}
            </ul>

            <p className="text-sm text-muted-foreground">
              מתחבר למה שכבר עובד אצלך — בלי להחליף את כל העסק ביום אחד.
            </p>

            <div>
              <p className="font-data mb-3 text-xs font-semibold tracking-wide text-muted-foreground">
                ערוצים ומערכות
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {CHANNEL_MARKS.map((mark) => (
                  <div
                    key={mark}
                    className="flex h-12 items-center justify-center rounded-xl border border-border bg-card px-1 text-center font-data text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:h-14 sm:text-xs"
                  >
                    {mark}
                  </div>
                ))}
              </div>
            </div>

            {wa ? (
              <Button
                asChild
                variant="outline"
                className="h-11 cursor-pointer rounded-full border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10"
              >
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    track('whatsapp_demo_clicked', { source: 'contact' })
                  }
                >
                  {SECONDARY_CTA_LABEL}
                </a>
              </Button>
            ) : null}
          </div>

          {/* Form card */}
          <form
            className="reveal tech-panel space-y-5 border-[hsl(var(--glow))]/20 p-6 sm:p-8"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-first">שם פרטי</Label>
                <Input
                  id="contact-first"
                  className="h-11"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-last">שם משפחה</Label>
                <Input
                  id="contact-last"
                  className="h-11"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">טלפון</Label>
              <Input
                id="contact-phone"
                type="tel"
                inputMode="tel"
                className="h-11"
                placeholder="05X-XXXXXXX"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-budget">תקציב משוער לחודש</Label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger id="contact-budget" className="h-11 w-full">
                  <SelectValue placeholder="בחרו טווח" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-msg">הודעה</Label>
              <Textarea
                id="contact-msg"
                rows={4}
                placeholder="ספרו בקצרה על העסק והלידים שלכם…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-ref">איך הגעתם אלינו? (אופציונלי)</Label>
              <Input
                id="contact-ref"
                className="h-11"
                placeholder="חבר, פרסום, חיפוש…"
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {status === 'ok' ? (
              <p role="status" className="text-sm text-[hsl(var(--trust))]">
                מעולה — נפתח וואטסאפ עם הפרטים.
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full cursor-pointer rounded-full bg-cta text-base font-semibold text-cta-foreground hover:bg-cta/90"
            >
              שלח פנייה
            </Button>
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              בשליחה אתם מאשרים שנחזור אליכם בוואטסאפ או בטלפון. בלי ספאם.{' '}
              <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                מדיניות פרטיות
              </a>
              .
            </p>
          </form>
        </div>

        {/* Footer pointers */}
        <div className="reveal mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm">
          <a
            href="/#faq"
            className="inline-flex cursor-pointer items-center gap-2 font-medium text-muted-foreground transition hover:text-foreground"
          >
            שאלות נפוצות
            <ArrowLeft className="size-4" aria-hidden />
          </a>
          <a
            href="/resources"
            className="inline-flex cursor-pointer items-center gap-2 font-medium text-muted-foreground transition hover:text-foreground"
          >
            מרכז ידע
            <ArrowLeft className="size-4" aria-hidden />
          </a>
          <a
            href="/#loss-calculator"
            className="inline-flex cursor-pointer items-center gap-2 font-medium text-muted-foreground transition hover:text-foreground"
          >
            מחשבון הפסדים
            <ArrowLeft className="size-4" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
