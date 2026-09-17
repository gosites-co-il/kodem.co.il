import { CALCULATOR_SECTION_ID } from '../lib/site-config';
import { track } from '../lib/analytics';

export function scrollToCalculator(source: string): void {
  track('hero_cta_click', { source });
  const el = document.getElementById(CALCULATOR_SECTION_ID);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const firstInput = el.querySelector<HTMLInputElement>('input');
    firstInput?.focus({ preventScroll: true });
  }
}
