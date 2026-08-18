import type {
  BusinessIntelligenceResult,
  BusinessReport,
  DiscoveryEventPublisher,
  DiscoveryRunResult,
  NormalizedDiscoveryContext,
} from '@kodem/contracts';
import type { BusinessIntelligenceInput } from '@kodem/contracts';
import { discoveryRunner } from '@kodem/engines/discovery';
import { buildDiscoveryContext } from '../domain/discovery-context';
import { UnderstandingService } from '../ai/understanding.service';

export class BusinessReportBuilder {
  build(
    discovery: DiscoveryRunResult,
    context: NormalizedDiscoveryContext,
    understanding: BusinessReport['understanding'],
    recommendations: BusinessReport['recommendations'],
    questions: BusinessReport['questions'],
  ): BusinessReport {
    return {
      workspaceId: discovery.workspaceId,
      facts: discovery.facts,
      understanding,
      recommendations,
      questions,
      confidence: understanding.confidence,
      generatedAt: new Date(),
    };
  }
}

export class BusinessIntelligenceRunner {
  constructor(
    private readonly understandingService = new UnderstandingService(),
    private readonly reportBuilder = new BusinessReportBuilder(),
  ) {}

  async run(
    input: BusinessIntelligenceInput,
    publisher?: DiscoveryEventPublisher,
  ): Promise<BusinessIntelligenceResult> {
    const discovery = await discoveryRunner.run(input, publisher);
    const context = buildDiscoveryContext(discovery, input.businessName);

    const { understanding, recommendations, questions } =
      await this.understandingService.generate(context);

    const report = this.reportBuilder.build(
      discovery,
      context,
      understanding,
      recommendations,
      questions,
    );

    return { discovery, context, report };
  }
}

export const businessIntelligenceRunner = new BusinessIntelligenceRunner();
