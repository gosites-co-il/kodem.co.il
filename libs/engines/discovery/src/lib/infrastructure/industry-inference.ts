/** Lightweight industry hints from public page signals — not AI. */
export function inferIndustryFromSignals(
  title?: string,
  keywords?: string,
  description?: string,
): string | undefined {
  const text = [title, keywords, description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!text.trim()) {
    return undefined;
  }

  const rules: Array<{ pattern: RegExp; industry: string }> = [
    {
      pattern:
        /דרושים|משרות|job board|recruit|hiring|careers|עבודה לצעירים|לוח דרושים/,
      industry: 'Human Resources / Job Board',
    },
    {
      pattern: /saas|software|פיתוח|תוכנה|tech|startup/,
      industry: 'Technology / Software',
    },
    {
      pattern: /מסעד|restaurant|food|קפה|בית קפה|catering/,
      industry: 'Food & Beverage',
    },
    {
      pattern: /חנות|shop|e-?commerce|קניות|retail|מוצרים/,
      industry: 'Retail / E-commerce',
    },
    {
      pattern: /עורך דין|law|legal|משפט/,
      industry: 'Legal Services',
    },
    {
      pattern: /רפוא|clinic|medical|health|בריאות|דנטל/,
      industry: 'Healthcare',
    },
    {
      pattern: /שיווק|marketing|פרסום|advertising|digital agency/,
      industry: 'Marketing & Advertising',
    },
    {
      pattern: /ביטוח|insurance|פיננס|finance|השקעות/,
      industry: 'Financial Services',
    },
    {
      pattern: /נדל|real estate|דירות|properties/,
      industry: 'Real Estate',
    },
    {
      pattern: /חינוך|education|קורס|לימוד|academy|הדרכה/,
      industry: 'Education & Training',
    },
  ];

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      return rule.industry;
    }
  }

  return undefined;
}
