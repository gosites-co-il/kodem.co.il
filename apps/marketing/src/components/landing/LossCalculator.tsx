import { useId, useMemo, useRef, useState } from 'react';
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
import { cn } from '@kodem/design-system/lib/utils';

const ERROR_COPY: Record<CalculatorValidationError, string> = {
  empty: 'מלא את כל השדות כדי לראות את המספר.',
  invalid: 'הזן מספרים תקינים בלבד.',
  negative: 'לא ניתן להזין ערכים שליליים.',
  answered_gt_total: 'מספר הלידים שנענו לא יכול להיות גדול מסך הלידים.',
  too_large: 'הערך גבוה מדי. בדוק שהמספרים נכונים.',
};

function tryPreview(input: {
  monthlyLeads: string;
  answeredInTime: string;
  averageDealValueIls: string;
}): CalculatorResult | null {
  const validation = validateCalculatorInput(input);
  if (!validation.ok) return null;
  return calculateMonthlyLoss(validation.input);
}

export function LossCalculator() {
  const formId = useId();
  const started = useRef(false);
  const [monthlyLeads, setMonthlyLeads] = useState('');
  const [answeredInTime, setAnsweredInTime] = useState('');
  const [averageDealValueIls, setAverageDealValueIls] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const preview = useMemo(
    () =>
      tryPreview({
        monthlyLeads,
        answeredInTime,
        averageDealValueIls,
      }),
    [monthlyLeads, answeredInTime, averageDealValueIls],
  );

  const display = result ?? preview;
  const missedLeads = display?.missedLeads ?? 0;
  const totalLeads = Number.parseInt(monthlyLeads, 10);
  const missRatio =
    display && Number.isFinite(totalLeads) && totalLeads > 0
      ? Math.min(1, display.missedLeads / totalLeads)
      : 0;

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
      className="scroll-mt-20 border-y border-border/70 bg-background py-16 sm:py-20"
      aria-labelledby={`${formId}-title`}
    >
      <div className="container-site">
        <div className="grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Burn board — full brand color */}
          <div className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-soft sm:p-8 lg:col-span-6">
            <div
              className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-[hsl(var(--spark))]/45 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -start-16 bottom-[-3rem] h-52 w-52 rounded-full bg-[hsl(var(--glow))]/40 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[hsl(var(--brand))]/50 to-transparent"
              aria-hidden
            />

            <h2
              id={`${formId}-title`}
              className="relative max-w-[15ch] text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl"
            >
              כמה כסף נשרף כל חודש על לידים שלא נענו בזמן?
            </h2>
            <p className="relative mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/85">
              שלושה מספרים — והמערכת מראה מה העסק משלם על שתיקה.
            </p>

            <div className="relative mt-10 flex items-end gap-4">
              <p className="font-mono text-6xl font-extrabold leading-none tracking-tight text-[hsl(var(--spark))] sm:text-7xl">
                {missedLeads > 0 ? missedLeads : '—'}
              </p>
              <p className="mb-1 max-w-[10rem] text-sm leading-snug text-primary-foreground/80">
                {display
                  ? `לידים שנשרפו · ${Math.round(missRatio * 100)}% מהזרימה`
                  : 'לידים שנשרפו יופיעו כאן בזמן אמת'}
              </p>
            </div>

            <div
              className="relative mt-5 h-2.5 overflow-hidden rounded-full bg-primary-foreground/20"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(missRatio * 100)}
              aria-label="שיעור לידים שלא נענו בזמן"
            >
              <div
                className="h-full rounded-full bg-[hsl(var(--spark))] transition-[width] duration-500 ease-out"
                style={{ width: `${Math.max(missRatio * 100, display ? 4 : 0)}%` }}
              />
            </div>

            {display ? (
              <div
                className={cn(
                  'relative mt-8 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur-[2px] transition',
                  result && 'border-[hsl(var(--spark))]/50 bg-primary-foreground/15',
                )}
                aria-live="polite"
              >
                <p className="text-sm text-primary-foreground/75">הפסד חודשי משוער</p>
                <p className="mt-1 font-mono text-4xl font-extrabold tracking-tight sm:text-5xl">
                  {formatIls(display.monthlyLossIls)}
                </p>
                <p className="mt-2 text-base font-semibold text-[hsl(var(--spark))]">
                  ≈ {formatIls(display.yearlyLossIls)} בשנה
                </p>
                {result ? (
                  <p className="mt-3 text-sm leading-relaxed text-primary-foreground/80">
                    בלי לידים שענו &quot;אני אחשוב על זה&quot; ואף אחד לא חזר אליהם.
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-primary-foreground/70">
                    תצוגה מקדימה — לחץ &quot;הראה לי את המספר&quot; לנעילה.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {/* Input desk */}
          <div className="flex flex-col lg:col-span-6">
            <form
              className="flex flex-1 flex-col rounded-[2rem] border border-border/80 bg-card p-6 shadow-card sm:p-8"
              onSubmit={onSubmit}
              noValidate
            >
              <p className="text-sm font-semibold text-muted-foreground">
                הזן את המספרים האמיתיים שלך
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  id={`${formId}-leads`}
                  label="לידים בחודש"
                  hint="כמה נכנסים אליך בערך"
                  value={monthlyLeads}
                  className="sm:col-span-2"
                  onChange={(v) => {
                    markStarted();
                    setMonthlyLeads(v);
                    setResult(null);
                  }}
                />
                <Field
                  id={`${formId}-answered`}
                  label="נענו בזמן"
                  hint="כמה הספקת לענות מהר"
                  value={answeredInTime}
                  onChange={(v) => {
                    markStarted();
                    setAnsweredInTime(v);
                    setResult(null);
                  }}
                />
                <Field
                  id={`${formId}-deal`}
                  label="שווי עסקה ממוצעת"
                  hint="בשקלים"
                  value={averageDealValueIls}
                  suffix="₪"
                  onChange={(v) => {
                    markStarted();
                    setAverageDealValueIls(v);
                    setResult(null);
                  }}
                />
              </div>

              {error ? (
                <p role="alert" className="mt-4 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="mt-8 h-12 w-full cursor-pointer rounded-full bg-cta text-base font-semibold text-cta-foreground hover:bg-cta/90 sm:mt-auto sm:w-auto sm:self-start sm:px-10"
              >
                הראה לי את המספר
              </Button>
            </form>

            {result ? (
              <div className="mt-6 animate-message-in">
                <LeadCaptureForm calculatorMonthlyLossIls={result.monthlyLossIls} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  suffix,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="text-foreground">
        {label}
      </Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          className={cn(
            'h-12 border-input bg-background text-base',
            suffix && 'pe-10',
          )}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
        />
        {suffix ? (
          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}
