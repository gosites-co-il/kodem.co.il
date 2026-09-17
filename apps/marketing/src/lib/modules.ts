import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Workflow,
  Plug,
  Kanban,
  ListChecks,
  History,
  BellRing,
  CalendarClock,
  MessageSquare,
  Share2,
  FileSpreadsheet,
  Calendar,
  Target,
  Search,
  Handshake,
  Sparkles,
  ShieldCheck,
  Link2,
} from 'lucide-react';

export type ModuleId = 'crm' | 'automations' | 'integrations';

export type ModuleCapability = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export type ModuleOutcome = {
  title: string;
  body: string;
};

export type ModuleStep = {
  title: string;
  body: string;
};

export type ModuleFaq = {
  q: string;
  a: string;
};

export type ProductModule = {
  id: ModuleId;
  eyebrow: string;
  teaserTitle: string;
  teaserBody: string;
  title: string;
  description: string;
  metaDescription: string;
  heroTitle: string;
  heroDescription: string;
  capabilities: ModuleCapability[];
  pains: ModuleOutcome[];
  outcomes: ModuleOutcome[];
  flow: ModuleStep[];
  faqs: ModuleFaq[];
  related: ModuleId[];
  icon: LucideIcon;
};

export const PRODUCT_MODULES: ProductModule[] = [
  {
    id: 'crm',
    eyebrow: 'CRM',
    icon: Users,
    teaserTitle: 'CRM שמזיז עסקאות',
    teaserBody: 'לידים, משפך, משימות והיסטוריה — במקום אחד שעובד עם השיחה.',
    title: 'כל הלקוחות במקום אחד — עם משפך שזז לבד',
    description:
      'לידים, אנשי קשר, משימות והיסטוריית שיחות במערכת אחת. לא עוד אקסלים, לא עוד “מי דיבר עם מי”.',
    metaDescription:
      'CRM של KODEM: לידים, משפך מכירות, משימות והיסטוריית שיחות — מחובר לאוטומציות ולוואטסאפ.',
    heroTitle: 'CRM שלא רק רושם.\nהוא מזיז את העסקה קדימה.',
    heroDescription:
      'כל ליד נכנס עם מקור, סטטוס והיסטוריה. השיחה, הפולו־אפ והמשימה חיים באותו מקום — כדי שתדעו תמיד מה הצעד הבא.',
    capabilities: [
      {
        icon: Users,
        title: 'לידים ואנשי קשר',
        body: 'כל פנייה נכנסת עם מקור, סטטוס ותיוג. ייבוא מאקסל ומה־CRM הישן בקליק.',
      },
      {
        icon: Kanban,
        title: 'משפך מכירות',
        body: 'חדש → נוצר קשר → מוסמך → סגור. רואים איפה עסקאות נתקעות בלי לנחש.',
      },
      {
        icon: ListChecks,
        title: 'משימות לצוות',
        body: 'מה נשאר לסגור היום, למי לחזור, ומי מחכה לתשובה ממך.',
      },
      {
        icon: History,
        title: 'היסטוריית פעילות',
        body: 'כל הודעה, שיחה ופגישה מתועדות — גם כשה־AI ענה וגם כשאתה נכנס.',
      },
    ],
    pains: [
      {
        title: 'לידים מתפזרים',
        body: 'פייסבוק, וואטסאפ, אקסל והודעות — אף אחד לא רואה את התמונה המלאה.',
      },
      {
        title: 'אין בעלות ברורה',
        body: '“מי אמור לחזור ללקוח?” נשאר באוויר, והעסקה מתקררת.',
      },
      {
        title: 'היסטוריה שבורה',
        body: 'נכנסים לשיחה בלי לדעת מה כבר נשאל, מה הובטח ומה נשאר פתוח.',
      },
    ],
    outcomes: [
      {
        title: 'משפך חי',
        body: 'רואים בכל רגע כמה לידים בכל שלב — ואיפה הם נתקעים.',
      },
      {
        title: 'רצף אחד ללקוח',
        body: 'שיחה, משימה וסטטוס מתעדכנים יחד, בלי העתקה ידנית.',
      },
      {
        title: 'צוות שסוגר',
        body: 'כל אחד יודע על מי הוא אחראי ומה הצעד הבא היום.',
      },
    ],
    flow: [
      {
        title: 'ליד נכנס',
        body: 'מפרסום, טופס, וואטסאפ או ייבוא — עם מקור ותיוג אוטומטי.',
      },
      {
        title: 'נכנס למשפך',
        body: 'סטטוס ברור, משימה אם צריך, והיסטוריה שמתחילה מיד.',
      },
      {
        title: 'השיחה והפולו־אפ',
        body: 'ה־AI או הצוות עובדים על אותו כרטיס לקוח — בלי לאבד הקשר.',
      },
      {
        title: 'סגירה או העברה',
        body: 'העסקה נסגרת, נדחית או מועברת — והמספרים במשפך מתעדכנים.',
      },
    ],
    faqs: [
      {
        q: 'אפשר לייבא את ה־CRM הקיים?',
        a: 'כן. מעלים רשימות מאקסל או מייצאים מהמערכת הישנה, והלידים נכנסים עם מקור וסטטוס התחלתי.',
      },
      {
        q: 'האם זה מחליף את ה־CRM שיש לי?',
        a: 'לרוב כן — כי כאן ה־CRM מחובר לשיחה ולאוטומציה. אם אתה רק צריך ארכיון אנשי קשר, כלי ישן יכול להספיק. אם אתה רוצה לסגור יותר — צריך מערכת שגורמת לדברים לקרות.',
      },
      {
        q: 'הצוות רואה את אותם נתונים?',
        a: 'כן. לידים, משימות והיסטוריה משותפים לWorkspace — עם בהירות מי אחראי על מה.',
      },
    ],
    related: ['automations', 'integrations'],
  },
  {
    id: 'automations',
    eyebrow: 'אוטומציות',
    icon: Workflow,
    teaserTitle: 'אוטומציות שסוגרות',
    teaserBody: 'פולו־אפ, תורים והתראות לפי מה שקורה בפועל, לא לפי רשימת משימות ידנית.',
    title: 'כללים שעובדים בזמן שאתה סוגר',
    description:
      'פולו־אפ, תזכורות, העברות והתראות — לפי מה שקורה בפועל בעסק, לא לפי תבנית גנרית.',
    metaDescription:
      'אוטומציות KODEM: פולו־אפ חכם, תיאום תורים והתראות לסגירה לפי אירועים אמיתיים בעסק.',
    heroTitle: 'אוטומציה שלא מרגישה כמו בוט.\nמרגישה כמו צוות שמעולם לא ישן.',
    heroDescription:
      'כללי תהליך מגיבים לליד חדש, שיחה שנעצרה או פגישה שבוטלה — ומזיזים את הלקוח קדימה בלי שתצטרכו לזכור הכל.',
    capabilities: [
      {
        icon: Workflow,
        title: 'כללי תהליך',
        body: 'ליד חדש, שיחה שנעצרה, פגישה שבוטלה — המערכת יודעת מה הצעד הבא.',
      },
      {
        icon: MessageSquare,
        title: 'פולו־אפ חכם',
        body: 'חוזרים ללקוח עד שיש תשובה ברורה, בטון שמתאים לעסק שלך.',
      },
      {
        icon: CalendarClock,
        title: 'תיאום תורים',
        body: 'השיחה קובעת פגישה ביומן ומאשרת ללקוח — בלי הודעות הלוך־חזור.',
      },
      {
        icon: BellRing,
        title: 'התראות לסגירה',
        body: 'כשליד מתחמם, אתה מקבל התראה ברורה: עכשיו הזמן להיכנס ולסגור.',
      },
    ],
    pains: [
      {
        title: 'פולו־אפ שנשכח',
        body: 'ליד חם מחכה יום, יומיים, שבוע — ואז כבר קנה אצל מישהו אחר.',
      },
      {
        title: 'תיאומים ידניים',
        body: 'הודעות הלוך־חזור על “מתי נוח לך?” גוזלות זמן ושוברות מומנטום.',
      },
      {
        title: 'התראות מאוחרות',
        body: 'אתם מגלים שהלקוח ביקש שיחה רק אחרי שהוא כבר התקרר.',
      },
    ],
    outcomes: [
      {
        title: 'מענה עקבי',
        body: 'כל ליד מקבל המשך — גם בערב, גם בשבת, גם כשאתם בפגישה.',
      },
      {
        title: 'פחות חיכוך',
        body: 'תורים מאושרים אוטומטית, בלי לנהל יומן בהודעות.',
      },
      {
        title: 'סגירות בזמן',
        body: 'נכנסים לשיחה כשהלקוח חם — לא כשהוא כבר בחר מתחרה.',
      },
    ],
    flow: [
      {
        title: 'אירוע בעסק',
        body: 'ליד נוצר, שיחה נעצרה, פגישה נקבעה או בוטלה — הכל נרשם כאירוע.',
      },
      {
        title: 'כלל מופעל',
        body: 'המערכת בוחרת את הצעד הבא לפי הכללים שהוגדרו לעסק שלך.',
      },
      {
        title: 'פעולה אוטומטית',
        body: 'הודעה, תזכורת, משימה לצוות או קביעת תור — בלי התערבות ידנית.',
      },
      {
        title: 'אתה נכנס כשצריך',
        body: 'כשצריך אדם לסגור — מקבלים התראה עם כל ההקשר.',
      },
    ],
    faqs: [
      {
        q: 'אפשר לשלוט מתי האוטומציה עוצרת?',
        a: 'כן. מגדירים מתי לעצור, מתי להעביר לאדם, ומה קורה אם הלקוח מבקש לדבר איתך.',
      },
      {
        q: 'זה מרגיש ספאמי ללקוחות?',
        a: 'הפולו־אפ מותאם לטון העסק, עם הפסקות הגיוניות והעברה לאדם לפי בקשה. המטרה היא תשובה — לא הצפה.',
      },
      {
        q: 'כמה זמן לוקח להקים כללים?',
        a: 'בהקמה המשותפת מגדירים את התהליך הבסיסי תוך דקות. אחר כך אפשר לחדד לפי מה שעובד בפועל.',
      },
    ],
    related: ['crm', 'integrations'],
  },
  {
    id: 'integrations',
    eyebrow: 'אינטגרציות',
    icon: Plug,
    teaserTitle: 'אינטגרציות שמזינות הכל',
    teaserBody: 'Meta, וואטסאפ, יומן וייבוא — כל חיבור פותח תובנות ואוטומציה חדשה.',
    title: 'מתחברים לכלים שכבר עובדים אצלך',
    description:
      'פייסבוק, אינסטגרם, וואטסאפ, גוגל ויומן — לא כתוספת, אלא כמקור ערך: תובנות, אוטומציה והבנה עסקית.',
    metaDescription:
      'אינטגרציות KODEM: Meta, וואטסאפ רשמי, יומן וייבוא נתונים — חיבורים שפותחים אוטומציה ו־ROAS.',
    heroTitle: 'כל חיבור הוא ערך.\nלא עוד “עוד API”.',
    heroDescription:
      'מחברים את הערוצים שכבר מביאים לכם לידים — וכל חיבור פותח תובנות, אוטומציה ומעקב עד לסגירה.',
    capabilities: [
      {
        icon: Share2,
        title: 'Meta ופרסום',
        body: 'לידים מפייסבוק ואינסטגרם נכנסים מיד, עם מעקב עד לסגירה ול־ROAS.',
      },
      {
        icon: MessageSquare,
        title: 'וואטסאפ רשמי',
        body: 'Meta API, תבניות מאושרות ומנגנון הסרה — בלי סיכון לחשבון.',
      },
      {
        icon: Calendar,
        title: 'יומן ופגישות',
        body: 'סנכרון ליומן העסקי כדי שהתורים שהמערכת קובעת באמת יופיעו אצלך.',
      },
      {
        icon: FileSpreadsheet,
        title: 'ייבוא וייצוא',
        body: 'אקסל, רשימות קיימות וחיבורים נוספים — בלי להתחיל מאפס.',
      },
    ],
    pains: [
      {
        title: 'העתקה ידנית',
        body: 'ליד מגיע בפייסבוק, מועתק לוואטסאפ, נרשם באקסל — ובדרך מישהו נופל.',
      },
      {
        title: 'ROAS עיוור',
        body: 'רואים קליקים, לא רואים אילו קמפיינים באמת סוגרים עסקאות.',
      },
      {
        title: 'חשבון בסיכון',
        body: 'שליחות לא רשמיות בוואטסאפ מסכנות את המספר העסקי.',
      },
    ],
    outcomes: [
      {
        title: 'זרימה רציפה',
        body: 'מקליק לליד לשיחה לעסקה — בלי העתקה ובלי חורים.',
      },
      {
        title: 'מדידה אמיתית',
        body: 'יודעים איזה מקור מחזיר כסף, לא רק איזה מקור מביא טפסים.',
      },
      {
        title: 'ערוץ מוגן',
        body: 'וואטסאפ דרך Meta API עם תבניות והסרה — לפי הכללים.',
      },
    ],
    flow: [
      {
        title: 'מחברים מקור',
        body: 'Meta, וואטסאפ, יומן או קובץ — בהקמה מודרכת, צעד אחרי צעד.',
      },
      {
        title: 'לידים זורמים פנימה',
        body: 'כל פנייה נכנסת ל־CRM עם מקור ותיוג, מוכנה לאוטומציה.',
      },
      {
        title: 'הערך נפתח',
        body: 'פולו־אפ, תורים ומעקב ROAS נשענים על החיבור — לא על עבודה ידנית.',
      },
      {
        title: 'משפרים לפי נתונים',
        body: 'רואים מה עובד בכל ערוץ ומתקנים את מה שלא.',
      },
    ],
    faqs: [
      {
        q: 'אילו חיבורים זמינים בהתחלה?',
        a: 'Meta (פייסבוק/אינסטגרם), וואטסאפ דרך Meta API, יומן וייבוא מאקסל. חיבורים נוספים מתווספים לפי צורך העסק.',
      },
      {
        q: 'החיבור מסכן את חשבון הוואטסאפ?',
        a: 'לא. KODEM עובדת רק דרך ה־API הרשמי של Meta, עם תבניות מאושרות ומנגנון הסרה.',
      },
      {
        q: 'כמה זמן לוקח לחבר?',
        a: 'בהקמה המשותפת רוב החיבורים עולים תוך דקות. אם חסרות הרשאות בחשבון הפרסום — נעבור על זה יחד.',
      },
    ],
    related: ['crm', 'automations'],
  },
];

export const MODULE_IDS = PRODUCT_MODULES.map((m) => m.id);

export function getModule(id: string): ProductModule | undefined {
  return PRODUCT_MODULES.find((m) => m.id === id);
}

export function modulePath(id: ModuleId): string {
  return `/product/${id}`;
}

export const MODULE_TEASERS = PRODUCT_MODULES.map((m) => ({
  id: m.id,
  eyebrow: m.eyebrow,
  title: m.teaserTitle,
  body: m.teaserBody,
  href: modulePath(m.id),
  icon: m.icon,
}));

/** Shared outcome icons for module page sections */
export const MODULE_SECTION_ICONS = {
  pain: Search,
  outcome: Target,
  flow: Sparkles,
  trust: ShieldCheck,
  link: Link2,
  handshake: Handshake,
} as const;
