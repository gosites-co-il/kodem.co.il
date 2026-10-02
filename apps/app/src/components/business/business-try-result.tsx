import type { BusinessTryResult, BusinessUnderstanding, UnderstandingField } from '@kodem/contracts';

const SOURCE_LABELS: Record<string, string> = {
  website: 'האתר',
  open_graph: 'Open Graph',
  'schema.org': 'Schema',
  regex: 'מהדף',
  facebook: 'Facebook',
  instagram: 'Instagram',
  google_business: 'Google Business',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X',
  sitemap: 'מפת אתר',
  robots: 'robots',
  wikipedia: 'ויקיפדיה',
  google_search: 'חיפוש Google',
  ai_extraction: 'מנוע AI',
  user_input: 'אומת על ידך',
};

const ASSET_LABELS: Record<string, string> = {
  WEBSITE: 'אתר',
  FACEBOOK: 'Facebook',
  GOOGLE_BUSINESS: 'Google Business',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  TIKTOK: 'TikTok',
  TWITTER: 'X',
  WIKIPEDIA: 'ויקיפדיה',
  GOOGLE_SEARCH: 'חיפוש Google',
};

const ASSET_STATUS: Record<string, string> = {
  completed: 'נקרא',
  failed: 'לא נקרא',
  skipped: 'דולג',
  pending: 'ממתין',
  processing: 'בתהליך',
};

function textOf(field: UnderstandingField<string> | UnderstandingField<string[]> | undefined): string {
  if (!field) return '';
  if (Array.isArray(field.value)) return field.value.filter(Boolean).join('\n');
  return field.value?.trim() ?? '';
}

function linesOf(value: string): string[] {
  return value
    .split(/\n|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function first(facts: BusinessTryResult['facts'], field: string): string {
  return facts.find((fact) => fact.field === field)?.value.trim() ?? '';
}

export function BusinessTryResultView({ result }: { result: BusinessTryResult }) {
  const facts = result.facts ?? [];
  const assets = result.assets ?? [];
  const name = first(facts, 'businessName') || 'העסק';
  const logo = first(facts, 'logo');
  const pitch = textOf(result.understanding?.businessSummary) || first(facts, 'description');
  const phone = first(facts, 'phones');
  const email = first(facts, 'emails');
  const website = first(facts, 'website');
  const address = first(facts, 'addresses');
  const hours = first(facts, 'openingHours');
  const offers = facts
    .filter((fact) => fact.field === 'services' || fact.field === 'products')
    .flatMap((fact) => linesOf(fact.value));
  const engine = [result.provider.provider, result.provider.model].filter(Boolean).join(' · ');

  const contacts = [
    phone ? { label: 'טלפון', value: phone } : null,
    email ? { label: 'אימייל', value: email } : null,
    website ? { label: 'אתר', value: website, href: website } : null,
    address ? { label: 'כתובת', value: address } : null,
    hours ? { label: 'שעות', value: hours } : null,
  ].filter((item): item is { label: string; value: string; href?: string } => !!item);

  return (
    <article className="space-y-10">
      <header className="flex items-start gap-4">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="size-16 shrink-0 rounded-lg border border-border object-cover"
          />
        ) : null}
        <div className="min-w-0 space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
          {pitch ? <p className="max-w-[68ch] text-base leading-7">{pitch}</p> : null}
          {engine ? (
            <p className="text-xs text-muted-foreground">הקריאה של {engine}</p>
          ) : null}
        </div>
      </header>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div className="space-y-10">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">איך מגיעים אליכם</h2>
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">לא נמצאו פרטי קשר.</p>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                {contacts.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
                    <dd className="mt-1 text-sm leading-6">
                      {item.href ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-secondary underline-offset-4 hover:underline"
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">מה אתם מציעים</h2>
            {offers.length === 0 ? (
              <p className="text-sm text-muted-foreground">לא נמצאו שירותים או מוצרים.</p>
            ) : (
              <ul className="list-disc space-y-2 ps-5">
                {offers.map((offer, index) => (
                  <li key={`${offer}-${index}`} className="text-sm leading-6">
                    {offer}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">נכסים</h2>
          {assets.length === 0 ? (
            <p className="text-sm text-muted-foreground">לא נמצאו נכסים מעבר לדף שנבדק.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {assets.map((asset) => (
                <li key={`${asset.type}-${asset.url}`} className="space-y-1 px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium">{ASSET_LABELS[asset.type] ?? asset.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {ASSET_STATUS[asset.status] ?? asset.status}
                    </p>
                  </div>
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm text-secondary underline-offset-4 hover:underline"
                  >
                    {asset.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <EngineReading understanding={result.understanding} />

      <CollectedFacts facts={facts} />
    </article>
  );
}

function EngineReading({ understanding }: { understanding: BusinessUnderstanding | null }) {
  const blocks: Array<{ label: string; value: string }> = [
    { label: 'הקהל', value: textOf(understanding?.targetAudience) },
    { label: 'הלקוח', value: textOf(understanding?.idealCustomer) },
    { label: 'מה מייחד', value: textOf(understanding?.uniqueSellingProposition) },
    { label: 'איך העסק עובד', value: textOf(understanding?.businessModel) },
    { label: 'קול', value: textOf(understanding?.brandVoice) },
    { label: 'ערוצים', value: textOf(understanding?.marketingChannels).replaceAll('\n', ', ') },
    { label: 'מטרות', value: textOf(understanding?.primaryGoals).replaceAll('\n', ', ') },
    { label: 'אתגרים', value: textOf(understanding?.businessChallenges).replaceAll('\n', ', ') },
  ].filter((item) => item.value);
  const missing = understanding?.missingInformation?.filter(Boolean) ?? [];
  const plan = understanding?.agentPlan;
  const hasPlan = Boolean(
    plan && (plan.overview || plan.workflow || plan.systemPrompt || plan.tools.length),
  );
  if (!hasPlan && blocks.length === 0 && missing.length === 0) return null;

  return (
    <section className="space-y-8">
      <h2 className="text-lg font-semibold">תוכנית לסוכן</h2>
      {hasPlan && plan ? <AgentPlan plan={plan} /> : null}
      {!hasPlan && blocks.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {blocks.map((item) => (
            <div key={item.label} className="max-w-[68ch] space-y-1">
              <h3 className="text-sm font-semibold">{item.label}</h3>
              <p className="text-sm leading-6">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {missing.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">מה עדיין חסר</h3>
          <ul className="list-disc space-y-1 ps-5 text-sm leading-6">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const FACT_LABELS: Record<string, string> = {
  legalName: 'שם משפטי',
  industry: 'תחום',
  subIndustry: 'תת-תחום',
  website: 'אתר',
  emails: 'אימייל',
  phones: 'טלפון',
  addresses: 'כתובת',
  whatsapp: 'וואטסאפ',
  socialProfiles: 'רשתות',
  services: 'שירותים',
  products: 'מוצרים',
  openingHours: 'שעות פתיחה',
  keywords: 'מילות מפתח',
  brandTagline: 'משפט מפתח',
  externalLinks: 'קישורים',
};

function AgentPlan({ plan }: { plan: NonNullable<BusinessUnderstanding['agentPlan']> }) {
  const sections = [
    { title: 'העסק', body: plan.overview },
    { title: 'מהלך השיחה', body: plan.workflow },
    { title: 'פרומפט מערכת', body: plan.systemPrompt },
  ].filter((section) => section.body.trim());

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.title} className="max-w-[72ch] space-y-2">
          <h3 className="text-sm font-semibold">{section.title}</h3>
          <p className="whitespace-pre-wrap text-sm leading-6">{section.body}</p>
        </div>
      ))}
      {plan.tools.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">כלים</h3>
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {plan.tools.map((tool) => (
              <li key={tool.name} className="space-y-1 px-4 py-3">
                <p className="text-sm font-medium">{tool.name}</p>
                <p className="text-sm leading-6">{tool.description}</p>
                {tool.parameters.length > 0 ? (
                  <p className="text-xs text-muted-foreground">{tool.parameters.join(' · ')}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CollectedFacts({ facts }: { facts: BusinessTryResult['facts'] }) {
  const hidden = new Set(['businessName', 'logo', 'description']);
  const visible = facts.filter((fact) => !hidden.has(fact.field) && fact.value.trim());
  if (visible.length === 0) return null;

  return (
    <details className="space-y-3">
      <summary className="cursor-pointer text-sm font-semibold">כל מה שנאסף</summary>
      <dl className="grid gap-4 pt-3 sm:grid-cols-2">
        {visible.map((fact, index) => (
          <div key={`${fact.field}-${index}`}>
            <dt className="text-xs font-medium text-muted-foreground">
              {FACT_LABELS[fact.field] ?? fact.field}
            </dt>
            <dd className="mt-1 text-sm leading-6">{fact.value}</dd>
            <p className="mt-1 text-xs text-muted-foreground">
              {SOURCE_LABELS[fact.source] ?? fact.source}
            </p>
          </div>
        ))}
      </dl>
    </details>
  );
}
