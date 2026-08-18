/** Canonical business profile fields discoverable by providers. */
export type BusinessFactField =
  | 'businessName'
  | 'legalName'
  | 'description'
  | 'industry'
  | 'subIndustry'
  | 'website'
  | 'logo'
  | 'language'
  | 'timezone'
  | 'emails'
  | 'phones'
  | 'addresses'
  | 'socialProfiles'
  | 'services'
  | 'products'
  | 'businessCategory'
  | 'openingHours'
  | 'rating'
  | 'reviewCount'
  | 'companySize'
  | 'employeeCount'
  | 'brandTagline'
  | 'keywords'
  | 'whatsapp'
  | 'externalLinks';

/** Source taxonomy used by the merge engine for conflict resolution. */
export type BusinessFactSource =
  | 'schema.org'
  | 'google_business'
  | 'open_graph'
  | 'website'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'ai_extraction'
  | 'regex'
  | 'user_input'
  | 'sitemap'
  | 'robots';

export interface BusinessFact {
  field: BusinessFactField;
  value: unknown;
  source: BusinessFactSource;
  confidence: number;
  verified: boolean;
  timestamp: Date;
  assetId?: string;
  assetType?: string;
}
