import type { BusinessRecordField, BusinessRecordView } from '@kodem/contracts';

function valueOf(fields: BusinessRecordField[], key: string): string {
  return fields.find((field) => field.key === key)?.value.trim() ?? '';
}

function sourceOf(fields: BusinessRecordField[], key: string): string {
  return fields.find((field) => field.key === key)?.sourceLabel.trim() ?? '';
}

function linesOf(value: string): string[] {
  return value
    .split(/\n|,\s*/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function BusinessSections({ record }: { record: BusinessRecordView }) {
  const identity = record.sections.identity;
  const contacts = record.sections.contacts;
  const name = valueOf(identity, 'name');
  const pitch = record.understandingSummary?.trim() || valueOf(identity, 'description');
  const industry = valueOf(identity, 'industry');
  const website = valueOf(identity, 'website');
  const phone = valueOf(contacts, 'phone');
  const email = valueOf(contacts, 'email');
  const address = valueOf(contacts, 'address');
  const social = valueOf(contacts, 'social');
  const hours = record.sections.hours.map((field) => field.value).filter(Boolean);
  const offers = record.sections.offers.flatMap((field) => linesOf(field.value));

  const reach = [
    industry ? { label: 'תחום', value: industry, source: sourceOf(identity, 'industry') } : null,
    phone ? { label: 'טלפון', value: phone, source: sourceOf(contacts, 'phone') } : null,
    email ? { label: 'אימייל', value: email, source: sourceOf(contacts, 'email') } : null,
    website
      ? { label: 'אתר', value: website, href: website, source: sourceOf(identity, 'website') }
      : null,
    address ? { label: 'כתובת', value: address, source: sourceOf(contacts, 'address') } : null,
    social ? { label: 'רשתות', value: social, source: sourceOf(contacts, 'social') } : null,
  ].filter((item): item is { label: string; value: string; source: string; href?: string } => !!item);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{name || 'פרופיל עסקי'}</h1>
        {pitch ? <p className="max-w-[68ch] text-base leading-7">{pitch}</p> : null}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">איך מגיעים אליכם</h2>
        {reach.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין פרטי קשר עדיין.</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            {reach.map((item) => (
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
                {item.source ? (
                  <p className="mt-1 text-xs text-muted-foreground">{item.source}</p>
                ) : null}
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">מה אתם מציעים</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין הצעות עדיין.</p>
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

      {hours.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">שעות פתיחה</h2>
          <ul className="space-y-2">
            {hours.map((hour) => (
              <li key={hour} className="text-sm leading-6">
                {hour}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
