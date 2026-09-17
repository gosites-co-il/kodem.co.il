import { useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Textarea } from '@kodem/design-system/components/ui/textarea';
import { PageHero } from '../site/PageHero';
import { getWhatsAppUrl, SECONDARY_CTA_LABEL } from '../../lib/site-config';
import { isValidIsraeliPhone, normalizePhone } from '../../lib/lead-capture';
import { track } from '../../lib/analytics';

export function ContactPage() {
  const wa = getWhatsAppUrl('היי KODEM, אשמח לשיחת היכרות');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isValidIsraeliPhone(phone)) {
      setStatus('error');
      setError('הזן שם וטלפון נייד ישראלי תקין.');
      return;
    }
    // No contact API yet — open WhatsApp with prefilled message when available,
    // otherwise show honest pending state.
    const text = `שם: ${name.trim()}\nטלפון: ${normalizePhone(phone)}\n${message.trim()}`;
    track('lead_form_submitted', { source: 'contact' });
    const phoneDigits =
      (import.meta.env.PUBLIC_WHATSAPP_PHONE as string | undefined)?.replace(/\D/g, '') ??
      '';
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
    <>
      <PageHero
        eyebrow="צור קשר"
        title={'נדבר במספרים.\nבלי לחץ.'}
        description="שיחת היכרות קצרה — בודקים אם KODEM מתאים לעסק שלך לפני שקל."
      />

      <section className="section-pad pt-0">
        <div className="container-site grid gap-8 lg:grid-cols-2">
          <form
            className="bento-card reveal space-y-4"
            onSubmit={onSubmit}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="contact-name">שם</Label>
              <Input
                id="contact-name"
                className="h-12"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">טלפון</Label>
              <Input
                id="contact-phone"
                type="tel"
                inputMode="tel"
                className="h-12"
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-msg">הודעה (אופציונלי)</Label>
              <Textarea
                id="contact-msg"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {status === 'ok' ? (
              <p role="status" className="text-sm text-cta">
                מעולה — נפתח וואטסאפ עם הפרטים.
              </p>
            ) : null}
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full cursor-pointer rounded-full bg-cta text-cta-foreground hover:bg-cta/90"
            >
              שלח פנייה
            </Button>
          </form>

          <div className="reveal space-y-4">
            <div className="bento-card">
              <h2 className="text-xl font-bold">וואטסאפ ישיר</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                רוצה לדבר עם המערכת עצמה? שלח הודעה עכשיו.
              </p>
              {wa ? (
                <Button
                  asChild
                  className="mt-5 h-11 cursor-pointer rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                >
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('whatsapp_demo_clicked', { source: 'contact' })}
                  >
                    {SECONDARY_CTA_LABEL}
                  </a>
                </Button>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                  יופעל אחרי הגדרת <code className="text-xs">PUBLIC_WHATSAPP_PHONE</code>.
                </p>
              )}
            </div>
            <div className="bento-card">
              <h2 className="text-xl font-bold">מחשבון הפסדים</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                60 שניות — בלי כרטיס אשראי.
              </p>
              <Button asChild variant="outline" className="mt-5 h-11 cursor-pointer rounded-full">
                <a href="/#loss-calculator">למחשבון</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
