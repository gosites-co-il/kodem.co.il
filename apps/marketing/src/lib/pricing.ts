export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceIls: 390,
    tagline: 'לעסק שרוצה להפסיק לאבד לידים.',
    badge: null as string | null,
    features: [
      'בוט AI מלא בעברית',
      'לידים ללא הגבלה',
      'CRM ופולו-אפים אוטומטיים',
      'חיבור פייסבוק ואינסטגרם',
      'דף נחיתה וכרטיס ביקור דיגיטלי',
      'ניהול תורים',
    ],
    cta: 'מתחילים עם Starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    priceIls: 790,
    tagline: 'לעסק שרוצה לדעת בדיוק מה עובד.',
    badge: 'הכי משתלם',
    features: [
      'כל מה שב-Starter',
      'ניתוח משפך מכירות והמלצות AI',
      'דשבורד ROAS: פייסבוק וגוגל',
      'תובנות עסקיות שבועיות',
      '2 דפי נחיתה',
      'ייצור תכנים עם AI',
    ],
    cta: 'מתחילים עם Growth',
  },
  {
    id: 'pro',
    name: 'Pro',
    priceIls: 1490,
    tagline: 'לעסקים עם נפח גבוה ולסוכנויות.',
    badge: null as string | null,
    features: [
      'כל מה שב-Growth',
      'אימון מכירות AI לצוות',
      '5 דפי נחיתה ואתר תדמית',
      'White Label לסוכנויות',
      'אנליטיקס מלא לאתר',
    ],
    cta: 'מתחילים עם Pro',
  },
] as const;

export const SETUP_FEE_ILS = 990;
