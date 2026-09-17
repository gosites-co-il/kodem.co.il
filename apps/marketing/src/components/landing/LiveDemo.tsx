import { Button } from '@kodem/design-system/components/ui/button';
import { track } from '../../lib/analytics';
import {
  getWhatsAppUrl,
  SECONDARY_CTA_LABEL,
} from '../../lib/site-config';
import { WhatsAppConversationDemo } from './WhatsAppConversationDemo';

export function LiveDemo() {
  const wa = getWhatsAppUrl('היי KODEM, ראיתי את הדמו באתר');

  return (
    <section id="demo" className="bg-background py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            &quot;בוט זה מרגיש רובוטי&quot; — עד שמדברים עם שלנו.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            השיחה שרצה כאן על המסך היא הדגמה של איך המערכת מנהלת שיחה: שואלת, מקשיבה,
            ומתאימה את עצמה. הלקוחות שלך לא יקבלו תפריט של אחד-שתיים-שלוש. הם יקבלו
            שיחה.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ההדגמה על המסך אינה שיחה חיה מהשרת — לשיחה אמיתית לחצו על הכפתור למטה.
          </p>

          {wa ? (
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 cursor-pointer bg-[#25D366] text-base text-white hover:bg-[#1ebe5d]"
            >
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_demo_clicked')}
              >
                {SECONDARY_CTA_LABEL}
              </a>
            </Button>
          ) : (
            <p className="mt-8 rounded-lg border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              כפתור הוואטסאפ יופעל אחרי הגדרת{' '}
              <code className="text-xs">PUBLIC_WHATSAPP_PHONE</code> ב־
              <code className="text-xs">.env</code>.
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            נפתח וואטסאפ. תשאל אותה מה שבא לך.
          </p>
        </div>
        <div className="flex justify-center">
          <WhatsAppConversationDemo caption="הדגמה מונפשת של זרימת שיחה" />
        </div>
      </div>
    </section>
  );
}
