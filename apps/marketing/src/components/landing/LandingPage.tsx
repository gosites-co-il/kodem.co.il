import { DEFAULT_HERO_VARIANT, type HeroVariantId } from '../../lib/hero-variants';
import { Hero } from '../landing/Hero';
import { SocialProof } from '../landing/SocialProof';
import { PainSection } from '../landing/PainSection';
import { LossCalculator } from '../landing/LossCalculator';
import { ThreePillars } from '../landing/ThreePillars';
import { ModulesTeaser } from '../landing/ModulesTeaser';
import { LiveDemo } from '../landing/LiveDemo';
import { HowItWorks } from '../landing/HowItWorks';
import { Comparison } from '../landing/Comparison';
import { Pricing } from '../landing/Pricing';
import { Testimonials } from '../landing/Testimonials';
import { FAQ } from '../landing/FAQ';
import { FinalCTA } from '../landing/FinalCTA';

type Props = {
  heroVariant?: HeroVariantId;
};

/** Homepage conversion narrative — chrome comes from SiteLayout. */
export function HomePage({ heroVariant = DEFAULT_HERO_VARIANT }: Props) {
  return (
    <>
      <Hero heroVariant={heroVariant} />
      <SocialProof />
      <PainSection />
      <LossCalculator />
      <ThreePillars />
      <ModulesTeaser />
      <LiveDemo />
      <HowItWorks />
      <Comparison />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
