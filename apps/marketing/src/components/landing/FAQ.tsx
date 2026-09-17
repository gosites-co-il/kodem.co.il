import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kodem/design-system/components/ui/accordion';
import { track } from '../../lib/analytics';

const FAQ_ITEMS = [
  {
    q: 'הלקוחות שלי לא יעדיפו בן אדם אמיתי?',
    a: 'הם מעדיפים תשובה עכשיו. הבוט מזדהה כעוזר דיגיטלי, עונה מקצועי ומעביר אליך בכל רגע שהלקוח מבקש. והנתון החשוב: ליד שנענה תוך 5 דקות סוגר פי 3.5 יותר מליד שחיכה שעה לבן אדם.',
  },
  {
    q: 'אני לא טכנולוגי. אסתדר עם זה?',
    a: 'ההקמה נעשית יחד איתנו, צעד אחרי צעד, תוך 30 דקות. אחרי זה המערכת עובדת לבד. אם אתה יודע להשתמש בוואטסאפ, אתה יודע להשתמש בKODEM.',
  },
  {
    q: 'יש לי כבר CRM. למה להחליף?',
    a: 'ה-CRM שלך רושם מה קרה. KODEM גורם לדברים לקרות: עונה, מתאם, עושה פולו-אפ ומראה לך כמה הפרסום החזיר. ואפשר לייבא את כל אנשי הקשר הקיימים בקליק.',
  },
  {
    q: 'מה קורה עם הלידים הישנים שלי?',
    a: 'מעלים אותם למערכת ומריצים קמפיין החזרה חכם. אצל רוב העסקים יושב במאגר הישן כסף שמחכה שמישהו יתקשר.',
  },
  {
    q: 'זה חוקי לשלוח הודעות בוואטסאפ?',
    a: 'KODEM עובדת רק דרך ה-API הרשמי של Meta, עם תבניות מאושרות ומנגנון הסרה מלא. החשבון שלך מוגן, והכל עומד בחוק הישראלי.',
  },
  {
    q: 'מה אם זה לא יעבוד לעסק שלי?',
    a: 'בשיחת ההיכרות אנחנו בודקים את המספרים שלך לפני שאתה משלם שקל. אם המערכת לא מתאימה לעסק שלך, נגיד לך את זה ישר. אנחנו לא מוכרים בכוח. ככה גם המערכת מוכרת.',
  },
] as const;

export function FAQ() {
  return (
    <section id="faq" className="bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold leading-tight sm:text-4xl">
          השאלות שכולם שואלים לפני שהם מצטרפים.
        </h2>
        <Accordion
          type="single"
          collapsible
          className="mt-10 w-full"
          onValueChange={(value) => {
            if (value) track('faq_opened', { item: value });
          }}
        >
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="cursor-pointer text-start text-base hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
