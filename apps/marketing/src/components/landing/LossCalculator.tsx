import { useId, useMemo, useRef, useState } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Button } from '@kodem/design-system/components/ui/button';
import { Input } from '@kodem/design-system/components/ui/input';
import { Label } from '@kodem/design-system/components/ui/label';
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
  const leadFormRef = useRef<HTMLDivElement>(null);
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
    requestAnimationFrame(() => {
      leadFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  return (
    <section
      id={CALCULATOR_SECTION_ID}
      className="section-pad scroll-mt-20 relative overflow-hidden bg-[hsl(var(--surface-dark))] text-[hsl(var(--surface-dark-fg))]"
      aria-labelledby={`${formId}-title`}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_90%_-10%,hsl(39_100%_63%/0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_100%,hsl(338_85%_46%/0.28),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_50%_50%,hsl(187_62%_66%/0.08),transparent_60%)]" />
      </div>
      <div className="container-site relative">
        <div className="reveal text-center lg:text-start">
          <h2
            id={`${formId}-title`}
            className="whitespace-nowrap text-[clamp(1.05rem,calc(0.5rem+3.6vw),2.5rem)] font-extrabold leading-[1.2] tracking-tight"
          >
            כמה כסף נשאר לך על השולחן כל חודש?
          </h2>
          <p className="mt-4 text-base text-white/75 sm:text-lg">
            ארבעה מספרים. המספרים שלך.
          </p>
        </div>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Inputs */}
          <div className="reveal flex flex-col">
            <div className="grid gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12">
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
              <div className="flex flex-col justify-end gap-4">
                <div className="flex items-end justify-between gap-3">
                  <Label
                    htmlFor={`${formId}-close`}
                    className="pb-1 text-base font-medium text-white/80 sm:text-lg"
                  >
                    אחוז סגירה
                  </Label>
                  <span className="font-data text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl lg:text-6xl">
                    {closeRatePercent}%
                  </span>
                </div>
                <CloseRateSlider
                  id={`${formId}-close`}
                  value={closeRatePercent}
                  onChange={(v) => {
                    markStarted();
                    setCloseRatePercent(v);
                  }}
                />
              </div>
            </div>

            <p className="mt-9 max-w-prose text-xs leading-relaxed text-white/55 sm:text-sm">
              החישוב: לידים שלא נענו מהר × שווי עסקה × אחוז סגירה. ברירת המחדל היא{' '}
              {DEFAULT_CLOSE_PCT}%, הערכה שמרנית. אם אתה סוגר יותר, שנה את זה.
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-[hsl(var(--spark))]/40 bg-[hsl(var(--spark))]/10 px-4 py-3 text-sm text-[hsl(var(--spark))]"
              >
                {error}
              </p>
            ) : null}
          </div>

          {/* Result — solid panel, sticky on desktop while editing */}
          <div
            className="bento-card-dark reveal relative lg:sticky lg:top-24"
            aria-live="polite"
          >
            <div
              className="pointer-events-none absolute -end-16 -top-20 h-48 w-48 rounded-full bg-cta/20 blur-3xl"
              aria-hidden
            />
            <div className="relative">
              <p className="text-sm font-medium text-white/70">
                כסף שנשאר על השולחן בחודש
              </p>
              <p
                key={display?.monthlyLossIls ?? 'empty'}
                className="font-data mt-3 text-5xl font-extrabold tracking-tight text-[hsl(var(--spark))] transition-opacity duration-300 sm:text-6xl lg:text-7xl"
              >
                {display ? formatIls(display.monthlyLossIls) : '—'}
              </p>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/10 pt-5">
                <p className="text-lg font-semibold text-white">
                  {display ? (
                    <>
                      <span className="font-data">{formatIls(display.yearlyLossIls)}</span>
                      <span className="ms-2 text-sm font-medium text-white/60">בשנה</span>
                    </>
                  ) : (
                    <span className="text-white/50">— בשנה</span>
                  )}
                </p>
                {display && display.missedLeads > 0 ? (
                  <p className="font-data text-sm text-white/55">
                    {display.missedLeads} לידים שלא נענו מהר
                  </p>
                ) : null}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-white/65">
                {display && display.missedLeads > 0
                  ? `${display.missedLeads} לידים בחודש חיכו יותר מדי. כל אחד מהם כבר שולם בפרסום.`
                  : 'הזן את המספרים שלך — ותראה כמה נשאר על השולחן.'}
              </p>

              <Button
                type="button"
                size="lg"
                onClick={onStopThis}
                className="mt-8 h-12 w-full cursor-pointer rounded-full bg-cta px-8 text-base font-semibold text-cta-foreground shadow-soft hover:bg-cta/90"
              >
                מפסיקים את זה עכשיו
              </Button>
            </div>
          </div>
        </div>

        {showLeadForm && display ? (
          <div ref={leadFormRef} className="reveal mt-10 scroll-mt-24">
            <LeadCaptureForm calculatorMonthlyLossIls={display.monthlyLossIls} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CloseRateSlider({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <SliderPrimitive.Root
      id={id}
      min={1}
      max={50}
      step={1}
      value={[value]}
      onValueChange={(v) => onChange(v[0] ?? DEFAULT_CLOSE_PCT)}
      aria-label={`אחוז סגירה: ${value}%`}
      className="relative flex h-10 w-full touch-none select-none items-center"
      dir="ltr"
    >
      <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-white/20">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-cta" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'block size-7 shrink-0 cursor-pointer rounded-full border-[3px] border-cta bg-white',
          'shadow-[0_3px_12px_-2px_rgba(0,0,0,0.5)] transition',
          'hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--spark))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface-dark))]',
        )}
      />
    </SliderPrimitive.Root>
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
    <div className="group space-y-3">
      <Label
        htmlFor={id}
        className="text-base font-medium text-white/80 transition-colors group-focus-within:text-white sm:text-lg"
      >
        {label}
      </Label>
      <Input
        id={id}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className={cn(
          'h-14 rounded-none border-0 border-b-[3px] border-white/25 bg-transparent px-0 sm:h-16',
          'font-data text-4xl font-extrabold tracking-tight text-white shadow-none caret-cta sm:text-5xl lg:text-6xl',
          'placeholder:text-white/35',
          'focus-visible:border-cta focus-visible:ring-0 focus-visible:ring-offset-0',
          'selection:bg-cta/30 selection:text-white',
        )}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
      />
    </div>
  );
}
