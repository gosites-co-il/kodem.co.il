import type { LucideIcon } from 'lucide-react';
import {
  Share2,
  MessageSquare,
  Calendar,
  FileSpreadsheet,
  Mail,
  Webhook,
} from 'lucide-react';

export type IntegrationStatus = 'available' | 'coming-soon';

export type IntegrationCatalogItem = {
  id: string;
  name: string;
  shortName: string;
  category: string;
  status: IntegrationStatus;
  summary: string;
  usedFor: string[];
  needs: string[];
  setupHint: string;
  icon: LucideIcon;
};

export const INTEGRATIONS_CATALOG: IntegrationCatalogItem[] = [
  {
    id: 'meta',
    name: 'Meta — פייסבוק ואינסטגרם',
    shortName: 'Meta',
    category: 'פרסום ולידים',
    status: 'available',
    summary: 'לידים מקמפיינים וטפסים נכנסים ישר ל־CRM עם מקור ותיוג.',
    usedFor: [
      'קליטת לידים מפייסבוק ומאינסטגרם בזמן אמת',
      'תיוג מקור הקמפיין למעקב עד לסגירה',
      'חיבור בין הוצאת פרסום ל־ROAS אמיתי',
    ],
    needs: [
      'חשבון Meta Business עם גישת אדמין',
      'דף עסקי ו/או חשבון אינסטגרם עסקי מחוברים',
      'הרשאה לטפסי לידים / Lead Ads הרלוונטיים',
      'אישור חיבור OAuth בזמן ההקמה',
    ],
    setupHint: 'בהקמה מחברים את החשבון פעם אחת; לידים חדשים זורמים אוטומטית.',
    icon: Share2,
  },
  {
    id: 'whatsapp',
    name: 'וואטסאפ עסקי (Meta API)',
    shortName: 'וואטסאפ',
    category: 'שיחות ומכירה',
    status: 'available',
    summary: 'שיחת מכירה רשמית דרך Meta API — בלי סיכון למספר העסקי.',
    usedFor: [
      'מענה ראשוני ללידים בוואטסאפ תוך שניות',
      'פולו־אפ ותבניות מאושרות לפי הכללים',
      'העברה חלקה לנציג אנושי כשצריך לסגור',
    ],
    needs: [
      'מספר וואטסאפ עסקי (או מספר מוכן להעברה ל־API)',
      'חשבון Meta Business מאומת',
      'גישה ל־WhatsApp Business Platform / Cloud API',
      'תבניות הודעה מאושרות לשליחה יזומה (לפי הצורך)',
    ],
    setupHint: 'עובדים רק דרך ה־API הרשמי של Meta, עם מנגנון הסרה מלא.',
    icon: MessageSquare,
  },
  {
    id: 'google-calendar',
    name: 'יומן Google',
    shortName: 'יומן Google',
    category: 'תורים ופגישות',
    status: 'available',
    summary: 'תורים שנקבעים בשיחה מופיעים ביומן העסקי שלך.',
    usedFor: [
      'קביעת פגישות אוטומטית מתוך השיחה',
      'מניעת כפילויות מול יומן קיים',
      'אישור ללקוח עם זמן מדויק',
    ],
    needs: [
      'חשבון Google של העסק / היומן הראשי',
      'הרשאת גישה ליומן (קריאה וכתיבה)',
      'בחירת היומן שבו יופיעו התורים',
    ],
    setupHint: 'מחברים OAuth ל־Google ובוחרים את היומן הנכון בהקמה.',
    icon: Calendar,
  },
  {
    id: 'excel-import',
    name: 'ייבוא מאקסל / CSV',
    shortName: 'ייבוא אקסל',
    category: 'נתונים',
    status: 'available',
    summary: 'מעלים לידים ואנשי קשר קיימים בלי להתחיל מאפס.',
    usedFor: [
      'העברת מאגר מה־CRM הישן או מאקסל',
      'קמפיין החזרה על לידים ישנים',
      'סנכרון ראשוני של אנשי קשר',
    ],
    needs: [
      'קובץ Excel או CSV עם עמודות שם / טלפון / אימייל',
      'מיפוי שדות בסיסי בהעלאה',
      'החלטה על סטטוס התחלתי ללידים המיובאים',
    ],
    setupHint: 'אפשר לייבא גם אחרי ההקמה — מהמערכת, בלי מפתח API.',
    icon: FileSpreadsheet,
  },
  {
    id: 'email',
    name: 'אימייל עסקי',
    shortName: 'אימייל',
    category: 'תקשורת',
    status: 'coming-soon',
    summary: 'שליחת אימיילים ומעקב תגובות כחלק ממשפך המכירה.',
    usedFor: [
      'פולו־אפ במייל כשהלקוח מעדיף את הערוץ הזה',
      'סיכומי פגישה ואישורים',
      'תיעוד תכתובת בכרטיס הלקוח',
    ],
    needs: [
      'כתובת אימייל עסקית (Google / Microsoft)',
      'הרשאות שליחה בשם הדומיין',
      'הגדרת SPF/DKIM לפי ספק המייל',
    ],
    setupHint: 'ברשימת הפיתוח — נעדכן כשיהיה זמין להקמה.',
    icon: Mail,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    shortName: 'Webhooks',
    category: 'מפתחים ואוטומציה',
    status: 'coming-soon',
    summary: 'שליחת אירועים למערכות חיצוניות כשליד משתנה או נסגר.',
    usedFor: [
      'חיבור לכלים פנימיים של העסק או הסוכנות',
      'הפעלת זרימות ב־Zapier / Make',
      'סנכרון סטטוסים למערכות אחרות',
    ],
    needs: [
      'כתובת HTTPS שמקבלת POST',
      'מפתח אימות / חתימה לפי ההגדרה',
      'מיפוי האירועים הרלוונטיים (ליד חדש, סגירה וכו׳)',
    ],
    setupHint: 'מיועד לצוותים טכניים ולסוכנויות עם מערכות קיימות.',
    icon: Webhook,
  },
];

export function getIntegration(id: string): IntegrationCatalogItem | undefined {
  return INTEGRATIONS_CATALOG.find((item) => item.id === id);
}

export function integrationPath(id: string): string {
  return `/integrations/${id}`;
}
