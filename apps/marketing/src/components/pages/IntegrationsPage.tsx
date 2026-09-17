import { ArrowLeft, Check, CircleAlert } from 'lucide-react';
import { Button } from '@kodem/design-system/components/ui/button';
import { PageHero } from '../site/PageHero';
import { NAV_SIGNUP_HREF, NAV_SIGNUP_LABEL } from '../../lib/site-config';
import {
  INTEGRATIONS_CATALOG,
  integrationPath,
  type IntegrationCatalogItem,
  type IntegrationStatus,
} from '../../lib/integrations-catalog';

function StatusBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'available') {
    return (
      <span className="inline-flex items-center rounded-full bg-cta/15 px-2.5 py-1 text-xs font-semibold text-cta">
        זמין
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      בקרוב
    </span>
  );
}

function IntegrationCard({ item }: { item: IntegrationCatalogItem }) {
  return (
    <a
      href={integrationPath(item.id)}
      className="bento-card reveal group flex cursor-pointer flex-col transition hover:border-cta/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(var(--surface-dark))] text-white shadow-soft">
          <item.icon className="size-5" aria-hidden />
        </div>
        <StatusBadge status={item.status} />
      </div>
      <p className="mt-4 text-xs font-semibold text-cta">{item.category}</p>
      <h2 className="mt-1 text-xl font-bold group-hover:text-cta">{item.shortName}</h2>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
      <div className="mt-5 space-y-2 border-t border-border/70 pt-4">
        <p className="text-xs font-semibold text-foreground">למה זה משמש</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.usedFor[0]}</p>
        <p className="text-xs font-semibold text-foreground">מה צריך</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.needs[0]}</p>
      </div>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
        לפרטי החיבור
        <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" aria-hidden />
      </span>
    </a>
  );
}

export function IntegrationsPage() {
  const available = INTEGRATIONS_CATALOG.filter((i) => i.status === 'available');
  const soon = INTEGRATIONS_CATALOG.filter((i) => i.status === 'coming-soon');

  return (
    <>
      <PageHero
        eyebrow="אינטגרציות"
        title={'החיבורים שמזינים את המערכת.\nמה משמש — ומה צריך.'}
        description="כל אינטגרציה כאן פותחת ערך אמיתי: לידים, שיחות, תורים או מדידה. לא עוד רשימת לוגו בלי תועלת."
      >
        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
          >
            <a href={NAV_SIGNUP_HREF}>{NAV_SIGNUP_LABEL}</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 cursor-pointer rounded-full"
          >
            <a href="/product">כל היכולות</a>
          </Button>
        </div>
      </PageHero>

      <section className="section-pad pt-0">
        <div className="container-site">
          <div className="reveal mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">זמינים עכשיו</h2>
              <p className="prose-site mt-2 max-w-2xl">
                החיבורים שניתן להקים בהדרכה — עם דרישות ברורות מראש.
              </p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {available.map((item) => (
              <IntegrationCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {soon.length > 0 ? (
        <section className="section-pad bg-muted/40">
          <div className="container-site">
            <div className="reveal mb-8">
              <h2 className="text-2xl font-extrabold sm:text-3xl">בקרוב</h2>
              <p className="prose-site mt-2 max-w-2xl">
                ברשימת הפיתוח — כדי שתדעו מה מתוכנן ומה יידרש כשזה יעלה.
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {soon.map((item) => (
                <IntegrationCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-pad pt-0">
        <div className="container-site">
          <div className="landing-gradient-dark reveal overflow-hidden rounded-2xl px-6 py-12 text-center text-[hsl(var(--surface-dark-fg))] sm:px-12">
            <h2 className="text-3xl font-extrabold sm:text-4xl">רוצים לחבר את הערוצים שלכם?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              בהקמה עוברים יחד על מה שצריך בכל חיבור — בלי הפתעות באמצע.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
              >
                <a href={NAV_SIGNUP_HREF}>{NAV_SIGNUP_LABEL}</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 cursor-pointer rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
              >
                <a href="/how-it-works">איך ההקמה עובדת</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

type DetailProps = {
  integrationId: string;
};

export function IntegrationDetailPage({ integrationId }: DetailProps) {
  const item = INTEGRATIONS_CATALOG.find((i) => i.id === integrationId);
  if (!item) return null;

  const others = INTEGRATIONS_CATALOG.filter((i) => i.id !== item.id).slice(0, 3);

  return (
    <>
      <PageHero
        eyebrow={item.category}
        title={item.name}
        description={item.summary}
      >
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={item.status} />
          <Button
            asChild
            size="lg"
            className="h-12 cursor-pointer rounded-full bg-cta px-6 text-cta-foreground hover:bg-cta/90"
          >
            <a href={NAV_SIGNUP_HREF}>{NAV_SIGNUP_LABEL}</a>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-12 cursor-pointer rounded-full">
            <a href="/integrations">כל האינטגרציות</a>
          </Button>
        </div>
      </PageHero>

      <section className="section-pad pt-0">
        <div className="container-site grid gap-6 lg:grid-cols-2">
          <article className="bento-card reveal">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--surface-dark))] text-white">
              <Check className="size-5" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold">למה זה משמש</h2>
            <ul className="mt-5 space-y-3">
              {item.usedFor.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cta" />
                  {line}
                </li>
              ))}
            </ul>
          </article>

          <article className="bento-card reveal">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--surface-dark))] text-white">
              <CircleAlert className="size-5" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold">מה צריך כדי לחבר</h2>
            <ul className="mt-5 space-y-3">
              {item.needs.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cta" />
                  {line}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section-pad bg-muted/40">
        <div className="container-site">
          <div className="bento-card reveal mx-auto max-w-3xl">
            <p className="text-xs font-semibold text-cta">בהקמה</p>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">איך זה עובד בפועל</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {item.setupHint}
            </p>
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-site">
          <h2 className="reveal text-2xl font-extrabold sm:text-3xl">חיבורים נוספים</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {others.map((rel) => (
              <a
                key={rel.id}
                href={integrationPath(rel.id)}
                className="bento-card reveal group flex cursor-pointer flex-col transition hover:border-cta/30"
              >
                <span className="text-xs font-semibold text-cta">{rel.category}</span>
                <h3 className="mt-2 text-lg font-bold group-hover:text-cta">{rel.shortName}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{rel.summary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
