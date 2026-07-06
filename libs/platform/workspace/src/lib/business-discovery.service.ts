import type { DiscoveredBusinessInfo, SourcedValue } from '@kodem/contracts';

function src<T>(value: T, source: string, confidence: number): SourcedValue<T> {
  return { value, source, confidence };
}

/**
 * Discovery engine — collects business signals from a website.
 * Production: crawl + structured data + AI extraction.
 */
export class BusinessDiscoveryService {
  async discover(websiteUrl: string): Promise<DiscoveredBusinessInfo> {
    const url = websiteUrl.trim().toLowerCase();
    const hostname = this.extractHostname(url);

    await this.simulateLatency();

    const isIsraeli = url.includes('.co.il') || url.includes('.il/');
    const businessName = this.inferName(hostname);
    const industry = isIsraeli ? 'שירותים לעסקים' : 'טכנולוגיה';
    const subIndustry = isIsraeli ? 'ייעוץ וניהול' : 'תוכנה';
    const description = `${businessName} — עסק ${isIsraeli ? 'ישראלי' : 'בינלאומי'} עם נוכחות דיגיטלית.`;
    const language = isIsraeli ? 'he' : 'en';
    const logoUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    const email = `info@${hostname}`;
    const phone = isIsraeli ? '03-0000000' : undefined;
    const social = [`https://www.linkedin.com/company/${hostname.split('.')[0]}`];
    const services = isIsraeli
      ? ['ייעוץ עסקי', 'שירותי ליווי']
      : ['SaaS', 'Professional services'];
    const products = ['חבילת ליבה'];

    const structuredData = {
      '@type': 'Organization',
      name: businessName,
      url: url.startsWith('http') ? url : `https://${hostname}`,
    };

    const seoMetadata = {
      title: `${businessName} | ${industry}`,
      description,
      robots: 'index,follow',
    };

    const openGraph = {
      'og:title': businessName,
      'og:description': description,
      'og:locale': language === 'he' ? 'he_IL' : 'en_US',
      'og:site_name': businessName,
    };

    const jsonLd = [structuredData];

    const result: DiscoveredBusinessInfo = {
      status: 'completed',
      businessName: src(businessName, 'hostname', 0.72),
      legalName: src(`${businessName} בע״מ`, 'inferred', 0.35),
      website: src(
        url.startsWith('http') ? url : `https://${hostname}`,
        'input',
        1,
      ),
      logo: src(logoUrl, 'favicon', 0.55),
      language: src(language, 'tld-heuristic', 0.8),
      description: src(description, 'meta-description', 0.62),
      industry: src(industry, 'content-heuristic', 0.58),
      subIndustry: src(subIndustry, 'content-heuristic', 0.45),
      emails: src([email], 'mailto-heuristic', 0.4),
      phones: phone ? src([phone], 'tel-heuristic', 0.35) : undefined,
      addresses: isIsraeli
        ? src(['תל אביב, ישראל'], 'footer-heuristic', 0.3)
        : undefined,
      socialProfiles: src(social, 'link-scan', 0.5),
      services: src(services, 'page-content', 0.48),
      products: src(products, 'page-content', 0.42),
      structuredData: src(structuredData, 'json-ld', 0.7),
      seoMetadata: src(seoMetadata, 'head-meta', 0.65),
      openGraph: src(openGraph, 'open-graph', 0.68),
      jsonLd: src(jsonLd, 'json-ld', 0.7),
      publicInfo: src(
        { registeredName: businessName, country: isIsraeli ? 'IL' : 'INT' },
        'public-registry-stub',
        0.25,
      ),
      name: businessName,
      logoUrl,
      email,
      phone,
    };

    return result;
  }

  private extractHostname(url: string): string {
    try {
      const normalized = url.startsWith('http') ? url : `https://${url}`;
      return new URL(normalized).hostname.replace(/^www\./, '');
    } catch {
      return url.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  private inferName(hostname: string): string {
    const base = hostname.split('.')[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  private simulateLatency(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 1200));
  }
}
