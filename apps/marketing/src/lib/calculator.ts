/**
 * Central assumptions for the loss calculator.
 * Change rates here — do not scatter magic numbers in UI.
 */
export const CALCULATOR_CONFIG = {
  /** Assumed close rate for leads that never got a timely reply. */
  missedLeadCloseRate: 0.15,
  /** Soft upper bounds to reject absurd inputs. */
  maxLeadsPerMonth: 100_000,
  maxDealValueIls: 10_000_000,
  minValue: 0,
} as const;

export type CalculatorInput = {
  monthlyLeads: number;
  answeredInTime: number;
  averageDealValueIls: number;
};

export type CalculatorResult = {
  missedLeads: number;
  monthlyLossIls: number;
  yearlyLossIls: number;
};

export type CalculatorValidationError =
  | 'empty'
  | 'invalid'
  | 'negative'
  | 'answered_gt_total'
  | 'too_large';

export type CalculatorValidation = {
  ok: true;
  input: CalculatorInput;
} | {
  ok: false;
  error: CalculatorValidationError;
  field?: keyof CalculatorInput;
};

function toNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.replace(/,/g, '').trim();
    if (normalized === '') return Number.NaN;
    return Number(normalized);
  }
  return Number.NaN;
}

export function validateCalculatorInput(raw: {
  monthlyLeads: unknown;
  answeredInTime: unknown;
  averageDealValueIls: unknown;
}): CalculatorValidation {
  const monthlyLeads = toNumber(raw.monthlyLeads);
  const answeredInTime = toNumber(raw.answeredInTime);
  const averageDealValueIls = toNumber(raw.averageDealValueIls);

  if (
    raw.monthlyLeads === '' ||
    raw.answeredInTime === '' ||
    raw.averageDealValueIls === '' ||
    raw.monthlyLeads == null ||
    raw.answeredInTime == null ||
    raw.averageDealValueIls == null
  ) {
    return { ok: false, error: 'empty' };
  }

  if (
    Number.isNaN(monthlyLeads) ||
    Number.isNaN(answeredInTime) ||
    Number.isNaN(averageDealValueIls)
  ) {
    return { ok: false, error: 'invalid' };
  }

  if (monthlyLeads < 0 || answeredInTime < 0 || averageDealValueIls < 0) {
    return { ok: false, error: 'negative' };
  }

  if (
    monthlyLeads > CALCULATOR_CONFIG.maxLeadsPerMonth ||
    answeredInTime > CALCULATOR_CONFIG.maxLeadsPerMonth ||
    averageDealValueIls > CALCULATOR_CONFIG.maxDealValueIls
  ) {
    return { ok: false, error: 'too_large' };
  }

  if (answeredInTime > monthlyLeads) {
    return { ok: false, error: 'answered_gt_total', field: 'answeredInTime' };
  }

  return {
    ok: true,
    input: { monthlyLeads, answeredInTime, averageDealValueIls },
  };
}

/**
 * monthlyLoss = missedLeads × averageDealValue × missedLeadCloseRate
 */
export function calculateMonthlyLoss(input: CalculatorInput): CalculatorResult {
  const missedLeads = Math.max(0, input.monthlyLeads - input.answeredInTime);
  const monthlyLossIls =
    missedLeads * input.averageDealValueIls * CALCULATOR_CONFIG.missedLeadCloseRate;
  const yearlyLossIls = monthlyLossIls * 12;

  return {
    missedLeads,
    monthlyLossIls: Math.round(monthlyLossIls),
    yearlyLossIls: Math.round(yearlyLossIls),
  };
}

export function formatIls(amount: number, locale = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}
