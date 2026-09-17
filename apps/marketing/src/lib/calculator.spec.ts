import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyLoss,
  validateCalculatorInput,
} from './calculator';

describe('calculateMonthlyLoss', () => {
  it('computes missed leads × deal × close rate', () => {
    const result = calculateMonthlyLoss({
      monthlyLeads: 100,
      answeredInTime: 40,
      averageDealValueIls: 1000,
    });
    // 60 missed * 1000 * 0.15 = 9000
    expect(result.missedLeads).toBe(60);
    expect(result.monthlyLossIls).toBe(9000);
    expect(result.yearlyLossIls).toBe(108000);
  });

  it('rejects answered > total', () => {
    const v = validateCalculatorInput({
      monthlyLeads: '10',
      answeredInTime: '11',
      averageDealValueIls: '100',
    });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toBe('answered_gt_total');
  });

  it('rejects empty', () => {
    const v = validateCalculatorInput({
      monthlyLeads: '',
      answeredInTime: '1',
      averageDealValueIls: '1',
    });
    expect(v.ok).toBe(false);
  });
});
