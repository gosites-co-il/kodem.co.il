import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyLoss,
  validateCalculatorInput,
} from './calculator';

describe('calculateMonthlyLoss', () => {
  it('computes missed leads × deal × close rate', () => {
    const result = calculateMonthlyLoss({
      monthlyLeads: 40,
      answeredInTime: 20,
      averageDealValueIls: 800,
      closeRate: 0.1,
    });
    // 20 missed * 800 * 0.1 = 1600
    expect(result.missedLeads).toBe(20);
    expect(result.monthlyLossIls).toBe(1600);
    expect(result.yearlyLossIls).toBe(19200);
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

  it('defaults close rate to 10%', () => {
    const v = validateCalculatorInput({
      monthlyLeads: '40',
      answeredInTime: '20',
      averageDealValueIls: '800',
    });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.input.closeRate).toBe(0.1);
  });
});
