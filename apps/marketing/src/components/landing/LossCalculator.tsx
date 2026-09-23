import { useId, useMemo, useRef, useState } from 'react';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
import { Slider } from '@kodem/design-system/components/ui/slider';
import { cn } from '@kodem/design-system/lib/utils';
import {
  CALCULATOR_CONFIG,
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
  close_rate: 'אחוז הסגירה חייב להיות בין 1% ל־100%.',
};

const DEFAULT_CLOSE_PCT = Math.round(CALCULATOR_CONFIG.defaultCloseRate * 100);

function tryPreview(input: {
  monthlyLeads: string;
  answeredInTime: string;
  averageDealValueIls: string;
  closeRatePercent: number;
}): CalculatorResult | null {
  const validation = validateCalculatorInput({
    ...input,
    closeRatePercent: input.closeRatePercent,
  });
  if (!validation.ok) return null;
  return calculateMonthlyLoss(validation.input);
}

export function LossCalculator() {
  const formId = useId();
  const started = useRef(false);
  const [monthlyLeads, setMonthlyLeads] = useState('40');
  const [answeredInTime, setAnsweredInTime] = useState('20');
  const [averageDealValueIls, setAverageDealValueIls] = useState('800');
  const [closeRatePercent, setCloseRatePercent] = useState(DEFAULT_CLOSE_PCT);
  const [error, setError] = useState<string | null>(null);
  const [showLeadForm, setShowLeadForm] = useState(false);

  const display = useMemo(
    () =>
      tryPreview({
        monthlyLeads,
        answeredInTime,
        averageDealValueIls,
        closeRatePercent,
      }),
    [monthlyLeads, answeredInTime, averageDealValueIls, closeRatePercent],
  );

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    track('calculator_started');
  };

  const onStopThis = () => {
    const validation = validateCalculatorInput({
      monthlyLeads,
      answeredInTime,
      averageDealValueIls,
      closeRatePercent,
    });

    if (!validation.ok) {
      setError(ERROR_COPY[validation.error]);
      setShowLeadForm(false);
      return;
    }

    const next = calculateMonthlyLoss(validation.input);
    setError(null);
    setShowLeadForm(true);
    track('calculator_completed', {
      monthly_loss: next.monthlyLossIls,
      yearly_loss: next.yearlyLossIls,
      close_rate: next.closeRate,
    });
  };

  return (
    <section
      id={CALCULATOR_SECTION_ID}
      className="scroll-mt-20 border-y border-border/70 bg-background py-16 sm:py-20"
      aria-labelledby={`${formId}-title`}
    >
      <div className="container-site">
        <div className="reveal mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-start">
          <h2
            id={`${formId}-title`}
            className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
          >
            כמה כסף נשאר לך על השולחן כל חודש?
          </h2>
          <p className="mt-3 text-muted-foreground">ארבעה מספרים. המספרים שלך.</p>
        </div>

        <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Inputs — first in DOM = start (right) in RTL */}
          <div className="flex flex-col">
            <div className="grid gap-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-8">
              <UnderlineField
                id={`${formId}-leads`}
                label="לידים בחודש"
                value={monthlyLeads}
                onChange={(v) => {
                  markStarted();
                  setMonthlyLeads(v);
                }}
              />
              <UnderlineField
                id={`${formId}-answered`}
                label="מתוכם נענו מהר"
                value={answeredInTime}
                onChange={(v) => {
                  markStarted();
                  setAnsweredInTime(v);
                }}
              />
              <UnderlineField
                id={`${formId}-deal`}
                label="שווי עסקה ממוצעת (₪)"
                value={averageDealValueIls}
                onChange={(v) => {
                  markStarted();
                  setAverageDealValueIls(v);
                }}
              />
              <div className="space-y-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Label htmlFor={`${formId}-close`} className="text-sm text-muted-foreground">
                    אחוז סגירה:
                  </Label>
                  <span
                    id={`${formId}-close`}
                    className="font-data text-2xl font-bold tabular-nums tracking-tight"
                  >
                    {closeRatePercent}%
                  </span>
                </div>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[closeRatePercent]}
                  onValueChange={(v) => {
                    markStarted();
                    setCloseRatePercent(v[0] ?? DEFAULT_CLOSE_PCT);
                  }}
                  aria-label="אחוז סגירה"
                  className="[&>span>span]:bg-cta [&>span[role=slider]]:border-cta"
                />
              </div>
            </div>

            <p className="mt-8 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              החישוב: לידים שלא נענו מהר × שווי עסקה × אחוז סגירה. ברירת המחדל היא{' '}
              {DEFAULT_CLOSE_PCT}%, הערכה שמרנית. אם אתה סוגר יותר, שנה את זה.
            </p>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>

          {/* Results card */}
          <div
            className="landing-gradient-dark flex flex-col justify-between rounded-2xl border border-[hsl(var(--glow))]/20 p-6 text-[hsl(var(--surface-dark-fg))] shadow-soft sm:p-8"
            aria-live="polite"
          >
            <div>
              <p className="text-sm text-white/70">כסף שנשאר על השולחן בחודש</p>
              <p className="font-data mt-3 text-5xl font-extrabold tracking-tight text-[hsl(var(--spark))] sm:text-6xl">
                {display ? formatIls(display.monthlyLossIls) : '—'}
              </p>
              <p className="mt-3 text-lg font-semibold text-white/90">
                {display ? `${formatIls(display.yearlyLossIls)} בשנה` : '— בשנה'}
              </p>
              <p className="mt-5 text-sm leading-relaxed text-white/65">
                {display && display.missedLeads > 0
                  ? `${display.missedLeads} לידים בחודש חיכו יותר מדי. כל אחד מהם כבר שולם בפרסום.`
                  : 'הזן את המספרים שלך — ותראה כמה נשאר על השולחן.'}
              </p>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={onStopThis}
              className="mt-8 h-12 w-full cursor-pointer rounded-full bg-white px-8 text-base font-semibold text-foreground hover:bg-white/90"
            >
              מפסיקים את זה עכשיו
            </Button>
          </div>
        </div>

        {showLeadForm && display ? (
          <div className="mt-8 animate-message-in">
            <LeadCaptureForm calculatorMonthlyLossIls={display.monthlyLossIls} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function UnderlineField({
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
    <div className="space-y-1">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className={cn(
          'h-11 rounded-none border-0 border-b border-border bg-transparent px-0 text-2xl font-bold tabular-nums shadow-none',
          'focus-visible:border-cta focus-visible:ring-0',
        )}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
      />
    </div>
  );
}
