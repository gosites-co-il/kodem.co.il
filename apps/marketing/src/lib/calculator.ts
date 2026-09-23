/**
 * Central assumptions for the loss calculator.
 * Change bounds here — do not scatter magic numbers in UI.
 */
export const CALCULATOR_CONFIG = {
  /** Default close rate when the visitor does not move the slider (10%). */
  defaultCloseRate: 0.1,
  /** Soft upper bounds to reject absurd inputs. */
  maxLeadsPerMonth: 100_000,
  maxDealValueIls: 10_000_000,
  minCloseRate: 0.01,
  maxCloseRate: 1,
  minValue: 0,
} as const;

export type CalculatorInput = {
  monthlyLeads: number;
  answeredInTime: number;
  averageDealValueIls: number;
  /** Fraction 0–1 (e.g. 0.1 = 10%). */
  closeRate: number;
};

export type CalculatorResult = {
  missedLeads: number;
  monthlyLossIls: number;
  yearlyLossIls: number;
  closeRate: number;
};

export type CalculatorValidationError =
  | 'empty'
  | 'invalid'
  | 'negative'
  | 'answered_gt_total'
  | 'too_large'
  | 'close_rate';

export type CalculatorValidation =
  | {
      ok: true;
      input: CalculatorInput;
    }
  | {
      ok: false;
      error: CalculatorValidationError;
      field?: keyof CalculatorInput;
    };

function toNumber(raw: unknown): number {
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const normalized = raw.replace(/,/g, '').replace(/%/g, '').trim();
    if (normalized === '') return Number.NaN;
    return Number(normalized);
  }
  return Number.NaN;
}

export function validateCalculatorInput(raw: {
  monthlyLeads: unknown;
  answeredInTime: unknown;
  averageDealValueIls: unknown;
  /** Percent 1–100 or fraction; empty uses default. */
  closeRatePercent?: unknown;
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

  let closeRate = CALCULATOR_CONFIG.defaultCloseRate;
  if (raw.closeRatePercent !== undefined && raw.closeRatePercent !== '') {
    const pct = toNumber(raw.closeRatePercent);
    if (Number.isNaN(pct)) return { ok: false, error: 'close_rate' };
    // Accept 0.1–1 as fraction or 1–100 as percent
    closeRate = pct > 1 ? pct / 100 : pct;
  }

  if (
    closeRate < CALCULATOR_CONFIG.minCloseRate ||
    closeRate > CALCULATOR_CONFIG.maxCloseRate
  ) {
    return { ok: false, error: 'close_rate', field: 'closeRate' };
  }

  return {
    ok: true,
    input: { monthlyLeads, answeredInTime, averageDealValueIls, closeRate },
  };
}

/**
 * monthlyLoss = missedLeads × averageDealValue × closeRate
 */
export function calculateMonthlyLoss(input: CalculatorInput): CalculatorResult {
  const missedLeads = Math.max(0, input.monthlyLeads - input.answeredInTime);
  const monthlyLossIls = missedLeads * input.averageDealValueIls * input.closeRate;
  const yearlyLossIls = monthlyLossIls * 12;

  return {
    missedLeads,
    monthlyLossIls: Math.round(monthlyLossIls),
    yearlyLossIls: Math.round(yearlyLossIls),
    closeRate: input.closeRate,
  };
}

export function formatIls(amount: number, locale = 'he-IL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(amount);
}
