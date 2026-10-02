import type {
  AgentWorkPlan,
  AiUnderstandingOutput,
  BusinessUnderstanding,
  NormalizedDiscoveryContext,
  UnderstandingField,
} from '@kodem/contracts';
import {
  getFactString,
  getFactStringArray,
} from '../domain/discovery-context';

function field<T = string>(
  value: T,
  confidence: number,
  source: 'ai' | 'facts' = 'ai',
): UnderstandingField<T> {
  return { value, confidence, source };
}

export function mapAiOutputToUnderstanding(
  output: AiUnderstandingOutput,
): BusinessUnderstanding {
  const c = Math.min(1, Math.max(0, output.confidence ?? 0.5));

  return {
    businessSummary: field(output.businessSummary, c),
    industry: field(output.industry, c),
    subIndustry: output.subIndustry
      ? field(output.subIndustry, c * 0.9)
      : undefined,
    businessModel: field(output.businessModel, c),
    targetAudience: field(output.targetAudience, c),
    idealCustomer: field(output.idealCustomer, c),
    mainServices: field(output.mainServices ?? [], c),
    products: field(output.products ?? [], c),
    uniqueSellingProposition: field(output.uniqueSellingProposition, c),
    competitiveAdvantages: field(output.competitiveAdvantages ?? [], c * 0.85),
    brandVoice: field(output.brandVoice, c * 0.8),
    keywords: field(output.keywords ?? [], c * 0.75),
    customerJourney: field(output.customerJourney, c * 0.7),
    marketingChannels: field(output.marketingChannels ?? [], c * 0.8),
    confidence: c,
    missingInformation: output.missingInformation ?? [],
    agentPlan: mapAgentPlan(output.agentPlan),
  };
}

/** Deterministic fallback — structures only discovered facts, never invents data. */
export function buildFactBasedUnderstanding(
  context: NormalizedDiscoveryContext,
): BusinessUnderstanding {
  const services = getFactStringArray(context, 'services');
  const products = getFactStringArray(context, 'products');
  const keywords = getFactStringArray(context, 'keywords');
  const industry =
    getFactString(context, 'industry') ??
    inferIndustryFromText(
      getFactString(context, 'description'),
      keywords,
      getFactString(context, 'businessName') ?? context.businessName,
    );
  const description = getFactString(context, 'description');
  const name = getFactString(context, 'businessName') ?? context.businessName;
  const website = context.websiteUrl;

  const serviceHints =
    services.length > 0
      ? services
      : industry?.includes('Job Board')
        ? ['Job listings for candidates', 'Recruitment for employers']
        : keywords.slice(0, 6);

  const summary =
    description && name
      ? `${name} — ${description}`
      : description ?? `Limited public data for ${name || 'this business'}.`;

  const missing: string[] = [];
  if (!industry || industry === 'Unknown') missing.push('industry');
  if (!serviceHints.length) missing.push('main services');
  if (!description) missing.push('business description');
  if (!getFactStringArray(context, 'emails').length) missing.push('contact email');
  if (!getFactStringArray(context, 'phones').length) missing.push('phone number');

  const signalCount = [description, industry, serviceHints.length, keywords.length].filter(
    (v) => (typeof v === 'number' ? v > 0 : Boolean(v)),
  ).length;
  const baseConfidence = signalCount >= 3 ? 0.62 : signalCount >= 2 ? 0.5 : 0.35;

  const targetAudience = industry?.includes('Job Board')
    ? 'Job seekers and employers in Israel'
    : '';

  const businessModel = industry?.includes('Job Board') ? 'Two-sided marketplace' : '';

  return {
    businessSummary: field(summary, baseConfidence, 'facts'),
    industry: field(industry ?? 'Unknown', industry ? 0.72 : 0.2, 'facts'),
    subIndustry: getFactString(context, 'subIndustry')
      ? field(getFactString(context, 'subIndustry')!, 0.6, 'facts')
      : undefined,
    businessModel: field(businessModel, industry ? 0.55 : 0.35, 'facts'),
    targetAudience: field(
      targetAudience,
      industry?.includes('Job Board') ? 0.5 : 0.2,
      'facts',
    ),
    idealCustomer: field(
      industry?.includes('Job Board') ? 'Young job seekers and hiring businesses' : '',
      industry?.includes('Job Board') ? 0.45 : 0.2,
      'facts',
    ),
    mainServices: field(serviceHints, serviceHints.length ? 0.7 : 0.2, 'facts'),
    products: field(products, products.length ? 0.75 : 0.2, 'facts'),
    uniqueSellingProposition: field('', 0.2, 'facts'),
    competitiveAdvantages: field([], 0.2, 'facts'),
    brandVoice: field('', 0.2, 'facts'),
    keywords: field(
      keywords.length
        ? keywords
        : ([name, industry, ...services].filter(Boolean) as string[]),
      keywords.length ? 0.65 : 0.4,
      'facts',
    ),
    customerJourney: field('', 0.2, 'facts'),
    marketingChannels: field(
      context.assetsProcessed.map((a) => a.type.toLowerCase()),
      0.5,
      'facts',
    ),
    confidence: baseConfidence,
    missingInformation: missing,
    agentPlan: factAgentPlan(name, description, services, context),
  };
}

function mapAgentPlan(plan: AiUnderstandingOutput['agentPlan']): AgentWorkPlan | undefined {
  if (!plan) return undefined;
  const tools = (plan.tools ?? [])
    .map((tool) => ({
      name: tool.name?.trim() ?? '',
      description: tool.description?.trim() ?? '',
      parameters: (tool.parameters ?? []).map((item) => item.trim()).filter(Boolean),
    }))
    .filter((tool) => tool.name && tool.description);
  const overview = plan.overview?.trim() ?? '';
  const workflow = plan.workflow?.trim() ?? '';
  const systemPrompt = plan.systemPrompt?.trim() ?? '';
  if (!overview && !workflow && !systemPrompt && tools.length === 0) return undefined;
  return { overview, workflow, systemPrompt, tools };
}

function factAgentPlan(
  name: string | undefined,
  description: string | undefined,
  services: string[],
  context: NormalizedDiscoveryContext,
): AgentWorkPlan | undefined {
  if (!name && !description) return undefined;
  const phone = getFactStringArray(context, 'phones')[0];
  const email = getFactStringArray(context, 'emails')[0];
  const contact = [phone, email].filter(Boolean).join(' או ');
  const overview = [
    description,
    services.length ? `שירותים שנמצאו: ${services.slice(0, 8).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
  const systemPrompt = [
    '# זהות ותפקיד',
    name ? `אתה הנציג של ${name}.` : 'אתה הנציג של העסק.',
    description ?? '',
    '# מבנה המוצרים והשירותים',
    services.length
      ? services.slice(0, 8).map((service) => `- ${service}`).join('\n')
      : 'לא נמצאה רשימת שירותים בממצאים.',
    '# כללי הסלמה ובטיחות',
    contact
      ? `כשהבקשה חורגת ממה שכתוב כאן, העבר לנציג: ${contact}.`
      : 'אין איש קשר בממצאים. אל תמציא טלפון או כתובת.',
    'אל תמציא מחירים, הבטחות או תהליכים שלא מופיעים בממצאים.',
  ]
    .filter(Boolean)
    .join('\n\n');
  return { overview, workflow: '', systemPrompt, tools: [] };
}

export function isValidAiOutput(value: unknown): value is AiUnderstandingOutput {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.businessSummary === 'string' &&
    typeof o.industry === 'string' &&
    typeof o.businessModel === 'string'
  );
}

function inferIndustryFromText(
  description?: string,
  keywords: string[] = [],
  title?: string,
): string | undefined {
  const text = [title, keywords.join(' '), description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/דרושים|משרות|job board|recruit|hiring|לוח דרושים|עבודה לצעירים/.test(text)) {
    return 'Human Resources / Job Board';
  }
  if (/saas|software|פיתוח|תוכנה/.test(text)) {
    return 'Technology / Software';
  }
  if (/מלון|מלונות|hotel|נופש|resort/.test(text)) {
    return 'Hospitality / Hotels';
  }
  if (/שיווק|marketing|פרסום|advertising/.test(text)) {
    return 'Marketing & Advertising';
  }
  return undefined;
}
