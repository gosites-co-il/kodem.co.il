import type { BusinessFact, DiscoveryAsset } from '@kodem/contracts';
import { SocialPageProvider } from './social-page.provider';
import { appendFact, createFact } from '../domain/fact-utils';

export class LinkedInProvider extends SocialPageProvider {
  readonly assetType = 'LINKEDIN' as const;
  readonly priority = 70;
  readonly factSource = 'linkedin' as const;

  protected extractPlatformFacts(
    _html: string,
    og: Record<string, string>,
    _meta: Record<string, string>,
    text: string,
    facts: BusinessFact[],
    asset: DiscoveryAsset,
  ): void {
    const options = { assetId: asset.id, assetType: asset.type };

    appendFact(
      facts,
      createFact('industry', og['og:industry'] ?? extractLabeled(text, 'Industry'), 'linkedin', 0.78, options),
    );

    appendFact(
      facts,
      createFact(
        'companySize',
        extractLabeled(text, 'Company size') ?? extractLabeled(text, 'גודל החברה'),
        'linkedin',
        0.72,
        options,
      ),
    );

    const employeesMatch = text.match(/(\d[\d,]*)\s+employees/i);
    if (employeesMatch?.[1]) {
      appendFact(
        facts,
        createFact(
          'employeeCount',
          Number(employeesMatch[1].replace(/,/g, '')),
          'linkedin',
          0.7,
          options,
        ),
      );
    }

    if (og['og:description']) {
      appendFact(
        facts,
        createFact('description', og['og:description'], 'linkedin', 0.8, options),
      );
    }
  }
}

function extractLabeled(text: string, label: string): string | undefined {
  const pattern = new RegExp(`${label}[:\\s]+([^\\n|]{3,80})`, 'i');
  return text.match(pattern)?.[1]?.trim();
}
