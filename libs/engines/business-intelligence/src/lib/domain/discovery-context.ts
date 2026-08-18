import type {
  BusinessFact,
  DiscoveryRunResult,
  NormalizedDiscoveryContext,
} from '@kodem/contracts';

export function buildDiscoveryContext(
  discovery: DiscoveryRunResult,
  businessName: string,
): NormalizedDiscoveryContext {
  const factsByField: NormalizedDiscoveryContext['factsByField'] = {};

  for (const fact of discovery.facts) {
    const list = factsByField[fact.field] ?? [];
    list.push({
      value: fact.value,
      source: fact.source,
      confidence: fact.confidence,
    });
    factsByField[fact.field] = list;
  }

  const discovered = discovery.discovered;
  const openGraph =
    discovered.openGraph?.value && typeof discovered.openGraph.value === 'object'
      ? (discovered.openGraph.value as Record<string, string>)
      : undefined;

  const schemaOrg = Array.isArray(discovered.jsonLd?.value)
    ? discovered.jsonLd.value
    : discovered.structuredData?.value
      ? [discovered.structuredData.value]
      : [];

  const pageSignals: NormalizedDiscoveryContext['pageSignals'] = [];

  if (discovered.website?.value) {
    pageSignals.push({
      url: String(discovered.website.value),
      title: discovered.businessName?.value
        ? String(discovered.businessName.value)
        : businessName,
      excerpt: discovered.description?.value
        ? String(discovered.description.value)
        : undefined,
      kind: 'website',
    });
  }

  if (discovered.services?.value?.length) {
    pageSignals.push({
      url: String(discovered.website?.value ?? ''),
      excerpt: discovered.services.value.join(', '),
      kind: 'services',
    });
  }

  if (discovered.products?.value?.length) {
    pageSignals.push({
      url: String(discovered.website?.value ?? ''),
      excerpt: discovered.products.value.join(', '),
      kind: 'products',
    });
  }

  return {
    businessName,
    websiteUrl: discovery.profile.website,
    factsByField,
    assetsProcessed: discovery.assetsProcessed.map((asset) => ({
      type: asset.type,
      url: asset.url,
    })),
    openGraph,
    schemaOrg,
    pageSignals,
  };
}

export function contextToPromptPayload(
  context: NormalizedDiscoveryContext,
): Record<string, unknown> {
  return {
    businessName: context.businessName,
    websiteUrl: context.websiteUrl,
    facts: context.factsByField,
    assets: context.assetsProcessed,
    openGraph: context.openGraph,
    schemaOrg: context.schemaOrg,
    pageSignals: context.pageSignals,
  };
}

export function getFactValues(
  context: NormalizedDiscoveryContext,
  field: string,
): unknown[] {
  return (context.factsByField[field] ?? []).map((f) => f.value);
}

export function getFactString(
  context: NormalizedDiscoveryContext,
  field: string,
): string | undefined {
  const values = getFactValues(context, field);
  const first = values.find((v) => typeof v === 'string' && v.trim());
  return typeof first === 'string' ? first : undefined;
}

export function getFactStringArray(
  context: NormalizedDiscoveryContext,
  field: string,
): string[] {
  const values = getFactValues(context, field);
  const arrays = values.filter((v): v is string[] => Array.isArray(v));
  return [...new Set(arrays.flat().filter((v) => typeof v === 'string'))];
}

export function answeredFields(context: NormalizedDiscoveryContext): Set<string> {
  const answered = new Set<string>();
  for (const [field, facts] of Object.entries(context.factsByField)) {
    if (facts.length > 0) {
      answered.add(field);
    }
  }
  return answered;
}

export function filterQuestionsByFacts<T extends { question: string }>(
  questions: T[],
  context: NormalizedDiscoveryContext,
): T[] {
  const answered = answeredFields(context);
  const known = new Set<string>();

  if (answered.has('businessName') || context.businessName) {
    known.add('name');
  }
  if (answered.has('industry')) known.add('industry');
  if (answered.has('services')) known.add('services');
  if (answered.has('products')) known.add('products');
  if (answered.has('website')) known.add('website');
  if (answered.has('emails')) known.add('email');
  if (answered.has('phones')) known.add('phone');

  return questions.filter((q) => {
    const lower = q.question.toLowerCase();
    if (known.has('name') && /business name|שם העסק|company name/i.test(lower)) {
      return false;
    }
    if (known.has('industry') && /industry|תחום|sector/i.test(lower)) {
      return false;
    }
    if (known.has('services') && /services|שירותים/i.test(lower)) {
      return false;
    }
    if (known.has('website') && /website|אתר/i.test(lower)) {
      return false;
    }
    return true;
  });
}
