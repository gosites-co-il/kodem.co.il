export type HeroVariantId = 'A' | 'B';

export const HERO_VARIANTS = {
  A: {
    id: 'A' as const,
    headline: 'העסק שלך עונה לכל ליד תוך 3 שניות.\nגם בשש בבוקר. גם בחג. גם כשאתה עסוק.',
  },
  B: {
    id: 'B' as const,
    headline: 'אף ליד לא הולך לאיבוד.\nוכל שקל נמדד.',
  },
} as const;

/** Change default without restructuring the page. */
export const DEFAULT_HERO_VARIANT: HeroVariantId = 'A';

export function getHeroHeadline(variant: HeroVariantId = DEFAULT_HERO_VARIANT): string {
  return HERO_VARIANTS[variant].headline;
}
