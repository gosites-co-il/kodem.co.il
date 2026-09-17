import { Button } from '@kodem/design-system/components/ui/button';
import { PageHero } from '../site/PageHero';

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="עלינו"
        title={'נבנה בישראל.\nלעסקים שמוכרים בוואטסאפ.'}
        description="KODEM נולד מתוך כאב אמיתי: לידים יקרים שנעלמים כי אף אחד לא ענה בזמן. אנחנו בונים את המערכת שסוגרת את הפער הזה."
      />

      <section className="section-pad">
        <div className="container-site grid gap-6 lg:grid-cols-3">
          {[
            {
              title: 'אמת במספרים',
              body: 'לא עוד “נראה לי שהקמפיין עובד”. ROAS, משפך, והמלצה אחת ברורה.',
            },
            {
              title: 'עברית כשפת אם',
              body: 'המוצר, השיחה והתמיכה — מותאמים לשוק הישראלי מהיום הראשון.',
            },
            {
              title: 'בלי מכירה בכוח',
              body: 'בשיחת היכרות בודקים התאמה לפני שקל. אם זה לא מתאים — נגיד.',
            },
          ].map((card) => (
            <article key={card.title} className="bento-card reveal">
              <h2 className="text-xl font-bold">{card.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="container-site">
          <div className="landing-gradient-dark reveal overflow-hidden rounded-[2rem] px-6 py-12 text-center text-[hsl(var(--surface-dark-fg))] sm:px-12">
            <h2 className="text-3xl font-extrabold sm:text-4xl">רוצה לבדוק התאמה?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              60 שניות במחשבון ההפסדים — או שיחה קצרה איתנו.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
              >
                <a href="/#loss-calculator">למחשבון</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 cursor-pointer rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
              >
                <a href="/contact">צור קשר</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
