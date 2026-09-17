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
    <section id="demo" className="section-pad bg-muted/25">
      <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            לא תפריט רובוטי.
            <br />
            שיחת מכירה שנשמעת אנושית.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            ההדגמה כאן מראה איך המערכת שואלת, מקשיבה ומתאימה טון — עד שנקבעת פגישה.
            הלקוחות לא מקבלים “לחץ 1”. הם מקבלים שיחה.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            זו הדגמה מונפשת, לא שיחה חיה מהשרת. לשיחה אמיתית — הכפתור למטה.
          </p>

          {wa ? (
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 cursor-pointer rounded-full bg-[#25D366] text-base font-semibold text-white hover:bg-[#1ebe5d]"
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
            <p className="mt-8 rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
              כפתור הוואטסאפ יופעל אחרי הגדרת{' '}
              <code className="text-xs">PUBLIC_WHATSAPP_PHONE</code> ב־
              <code className="text-xs">.env</code>.
            </p>
          )}
        </div>
        <div className="relative flex justify-center">
          <div
            className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_40%,hsl(187_62%_66%/0.22),transparent_65%)] blur-2xl"
            aria-hidden
          />
          <WhatsAppConversationDemo
            className="relative"
            caption="הדגמה מונפשת של זרימת שיחה"
          />
        </div>
      </div>
    </section>
  );
}
