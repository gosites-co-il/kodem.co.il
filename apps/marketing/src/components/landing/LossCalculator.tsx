import { useId, useRef, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import {
  calculateMonthlyLoss,
  formatIls,
  validateCalculatorInput,
  type CalculatorResult,
  type CalculatorValidationError,
} from '../../lib/calculator';
import { track } from '../../lib/analytics';
import { CALCULATOR_SECTION_ID } from '../../lib/site-config';
import { LeadCaptureForm } from './LeadCaptureForm';

const ERROR_COPY: Record<CalculatorValidationError, string> = {
  empty: 'מלא את כל השדות כדי לראות את המספר.',
  invalid: 'הזן מספרים תקינים בלבד.',
  negative: 'לא ניתן להזין ערכים שליליים.',
  answered_gt_total: 'מספר הלידים שנענו לא יכול להיות גדול מסך הלידים.',
  too_large: 'הערך גבוה מדי. בדוק שהמספרים נכונים.',
};

export function LossCalculator() {
  const formId = useId();
  const started = useRef(false);
  const [monthlyLeads, setMonthlyLeads] = useState('');
  const [answeredInTime, setAnsweredInTime] = useState('');
  const [averageDealValueIls, setAverageDealValueIls] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track('calculator_started');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCalculatorInput({
      monthlyLeads,
      answeredInTime,
      averageDealValueIls,
    });

    if (!validation.ok) {
      setResult(null);
      setError(ERROR_COPY[validation.error]);
      return;
    }

    const next = calculateMonthlyLoss(validation.input);
    setError(null);
    setResult(next);
    track('calculator_completed', {
      monthly_loss: next.monthlyLossIls,
      yearly_loss: next.yearlyLossIls,
    });
  };

  return (
    <section
      id={CALCULATOR_SECTION_ID}
      className="landing-gradient-dark scroll-mt-20 py-16 text-[hsl(var(--surface-dark-fg))] sm:py-20"
      aria-labelledby={`${formId}-title`}
    >
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <h2
          id={`${formId}-title`}
          className="text-center text-3xl font-bold leading-tight sm:text-4xl"
        >
          כמה כסף העסק שלך מאבד כל חודש?
        </h2>

        <form
          className="mt-10 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-8"
          onSubmit={onSubmit}
          noValidate
        >
          <Field
            id={`${formId}-leads`}
            label="כמה לידים נכנסים אליך בחודש?"
            value={monthlyLeads}
            onChange={(v) => {
              markStarted();
              setMonthlyLeads(v);
            }}
          />
          <Field
            id={`${formId}-answered`}
            label="לכמה מהם אתה מספיק לענות בזמן?"
            value={answeredInTime}
            onChange={(v) => {
              markStarted();
              setAnsweredInTime(v);
            }}
          />
          <Field
            id={`${formId}-deal`}
            label="כמה שווה לך עסקה ממוצעת?"
            value={averageDealValueIls}
            onChange={(v) => {
              markStarted();
              setAverageDealValueIls(v);
            }}
          />

          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="h-12 w-full cursor-pointer bg-cta text-base text-cta-foreground hover:bg-cta/90"
          >
            הראה לי את המספר
          </Button>
        </form>

        {result ? (
          <div
            className="mt-8 animate-message-in rounded-2xl border border-cta/40 bg-cta/10 p-6 text-center"
            aria-live="polite"
          >
            <p className="whitespace-pre-line text-xl font-bold leading-relaxed sm:text-2xl">
              {`העסק שלך מאבד בערך ${formatIls(result.monthlyLossIls)} בחודש\nמלידים שלא קיבלו מענה בזמן.`}
            </p>
            <p className="mt-3 text-lg font-semibold text-emerald-300">
              זה {formatIls(result.yearlyLossIls)} בשנה.
            </p>
            <p className="mt-4 text-sm text-white/70">
              המספר הזה לא כולל את הלידים שענו לך &quot;אני אחשוב על זה&quot; ואף אחד לא חזר
              אליהם.
            </p>
          </div>
        ) : null}

        {result ? (
          <div className="mt-10">
            <LeadCaptureForm calculatorMonthlyLossIls={result.monthlyLossIls} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white/90">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className="h-12 border-white/20 bg-white/95 text-base text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
}
