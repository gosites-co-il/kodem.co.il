import { useRef, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { track } from '../../lib/analytics';
import {
  isValidIsraeliPhone,
  submitLead,
  type LeadSubmitResult,
} from '../../lib/lead-capture';

type Props = {
  calculatorMonthlyLossIls: number;
};

type FormState = 'idle' | 'loading' | 'success' | 'error';

export function LeadCaptureForm({ calculatorMonthlyLossIls }: Props) {
  const submitted = useRef(false);
  const started = useRef(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track('lead_form_started');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted.current || state === 'loading') return;

    if (!name.trim() || !isValidIsraeliPhone(phone)) {
      setState('error');
      setErrorMsg('הזן שם וטלפון נייד ישראלי תקין.');
      return;
    }

    setState('loading');
    setErrorMsg(null);
    submitted.current = true;

    const result: LeadSubmitResult = await submitLead({
      name,
      phone,
      source: 'loss_calculator',
      calculatorMonthlyLossIls,
    });

    if (result.ok) {
      setState('success');
      track('lead_form_submitted', { status: 'ok' });
      return;
    }

    submitted.current = false;
    setState('error');
    track('lead_form_submitted', { status: result.error });

    if (result.error === 'not_configured') {
      setErrorMsg(
        'הטופס מוכן, אבל נקודת הקצה עדיין לא מחוברת בשרת. נשמור את הפרטים ברגע שהאינטגרציה תעלה — או צור קשר בוואטסאפ.',
      );
      return;
    }
    if (result.error === 'validation') {
      setErrorMsg('הזן שם וטלפון נייד ישראלי תקין.');
      return;
    }
    setErrorMsg('משהו השתבש. נסה שוב בעוד רגע.');
  };

  if (state === 'success') {
    return (
      <div
        className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center"
        role="status"
      >
        <p className="text-lg font-semibold">קיבלנו אותך.</p>
        <p className="mt-2 text-sm text-white/75">
          אם חיבור הוואטסאפ פעיל בצד השרת, תקבל הודעה מהמערכת תוך שניות.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-6">
      <h3 className="text-center text-xl font-bold sm:text-2xl">
        רוצה לעצור את זה השבוע?
      </h3>
      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="lead-name" className="text-white/90">
            שם
          </Label>
          <Input
            id="lead-name"
            name="name"
            autoComplete="name"
            className="h-12 border-white/20 bg-white/95 text-foreground"
            value={name}
            onChange={(e) => {
              markStarted();
              setName(e.target.value);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lead-phone" className="text-white/90">
            טלפון
          </Label>
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05X-XXXXXXX"
            className="h-12 border-white/20 bg-white/95 text-foreground"
            value={phone}
            onChange={(e) => {
              markStarted();
              setPhone(e.target.value);
            }}
            required
          />
        </div>

        {errorMsg ? (
          <p role="alert" className="text-sm text-red-300">
            {errorMsg}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={state === 'loading'}
          className="h-auto min-h-12 w-full cursor-pointer whitespace-normal bg-cta px-4 py-3 text-sm text-cta-foreground hover:bg-cta/90 sm:text-base"
        >
          {state === 'loading'
            ? 'שולח...'
            : 'תוך 3 שניות תקבל וואטסאפ מהמערכת. תרגיש בעצמך.'}
        </Button>
        <p className="text-center text-xs text-white/65">
          זו לא הודעה שיווקית. זה הדמו. השיחה הראשונה שלך עם KODEM.
        </p>
      </form>
    </div>
  );
}
