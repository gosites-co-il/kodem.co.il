import { ArrowLeft } from 'lucide-react';
import { PageHero } from '../site/PageHero';

const ARTICLES = [
  {
    slug: 'lead-response-time',
    title: 'למה ליד שנענה תוך 5 דקות סוגר פי 3.5 יותר',
    excerpt: 'המספרים מאחורי זמן המענה — ומה זה אומר לעסק שמפרסם בפייסבוק.',
    tag: 'מכירות',
  },
  {
    slug: 'whatsapp-meta-api',
    title: 'וואטסאפ עסקי דרך Meta API: מה חוקי ומה מסוכן',
    excerpt: 'תבניות, הסרה, ושמירה על החשבון — בלי קיצורי דרך מסוכנים.',
    tag: 'ציות',
  },
  {
    slug: 'roas-funnel',
    title: 'ROAS בלי עיוורון: מהפרסום עד הסגירה',
    excerpt: 'איך מחברים קליק, ליד, שיחה ועסקה למספר אחד שאפשר לסמוך עליו.',
    tag: 'אנליטיקס',
  },
] as const;

export function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="מרכז ידע"
        title={'ידע שמחזיר כסף.\nלא תוכן לשם תוכן.'}
        description="מדריכים קצרים לעסקים בישראל שמוכרים בוואטסאפ ומפרסמים בפייסבוק וגוגל."
      />

      <section className="section-pad pt-0">
        <div className="container-site grid gap-5 md:grid-cols-3">
          {ARTICLES.map((article) => (
            <article key={article.slug} className="bento-card reveal group flex flex-col">
              <span className="text-xs font-semibold text-cta">{article.tag}</span>
              <h2 className="mt-3 text-lg font-bold leading-snug group-hover:text-cta">
                <a href={`/resources/${article.slug}`} className="cursor-pointer">
                  {article.title}
                </a>
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
              <a
                href={`/resources/${article.slug}`}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground"
              >
                לקריאה
                <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" aria-hidden />
              </a>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
