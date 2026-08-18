import type { BusinessFact, BusinessFactField, BusinessFactSource } from '@kodem/contracts';

const MERGE_SOURCE_PRIORITY: Record<BusinessFactSource, number> = {
  'schema.org': 100,
  google_business: 90,
  open_graph: 80,
  website: 70,
  facebook: 65,
  instagram: 60,
  linkedin: 58,
  tiktok: 55,
  ai_extraction: 50,
  regex: 40,
  sitemap: 35,
  robots: 30,
  user_input: 95,
};

function scoreFact(fact: BusinessFact): number {
  const sourceScore = MERGE_SOURCE_PRIORITY[fact.source] ?? 0;
  return sourceScore + fact.confidence * 10 + (fact.verified ? 25 : 0);
}

function pickHighest(candidates: BusinessFact[]): BusinessFact | undefined {
  let winner = candidates[0];
  if (!winner) {
    return undefined;
  }
  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    if (scoreFact(candidate) > scoreFact(winner)) {
      winner = candidate;
    }
  }
  return winner;
}

function isArrayField(field: BusinessFactField): boolean {
  return [
    'emails',
    'phones',
    'addresses',
    'socialProfiles',
    'services',
    'products',
    'externalLinks',
  ].includes(field);
}

export class MergeEngine {
  private readonly facts: BusinessFact[] = [];

  add(fact: BusinessFact): void {
    this.facts.push(fact);
  }

  addMany(facts: BusinessFact[]): void {
    for (const fact of facts) {
      this.add(fact);
    }
  }

  getMerged(): Map<BusinessFactField, BusinessFact> {
    const grouped = new Map<BusinessFactField, BusinessFact[]>();

    for (const fact of this.facts) {
      const list = grouped.get(fact.field) ?? [];
      list.push(fact);
      grouped.set(fact.field, list);
    }

    const merged = new Map<BusinessFactField, BusinessFact>();

    for (const [field, candidates] of grouped) {
      if (isArrayField(field)) {
        const combined = this.mergeArrayField(candidates);
        if (combined) {
          merged.set(field, combined);
        }
        continue;
      }

      const winner = pickHighest(candidates);
      if (winner) {
        merged.set(field, winner);
      }
    }

    return merged;
  }

  getAllFacts(): BusinessFact[] {
    return [...this.facts];
  }

  private mergeArrayField(candidates: BusinessFact[]): BusinessFact | null {
    const winner = pickHighest(candidates);
    if (!winner) {
      return null;
    }

    const values = new Set<string>();
    let maxConfidence = 0;

    for (const candidate of candidates) {
      maxConfidence = Math.max(maxConfidence, candidate.confidence);
      if (Array.isArray(candidate.value)) {
        for (const item of candidate.value) {
          if (typeof item === 'string' && item.trim()) {
            values.add(item.trim());
          }
        }
      }
    }

    if (values.size === 0) {
      return null;
    }

    return {
      ...winner,
      value: [...values],
      confidence: maxConfidence,
    };
  }
}
