import type {
  AiUnderstandingOutput,
  BiQuestion,
  BiRecommendation,
  NormalizedDiscoveryContext,
} from '@kodem/contracts';
import {
  createJsonParser,
  defaultLLMProvider,
  routeModel,
  type LLMProvider,
} from '@kodem/platform/ai';
import {
  buildFactBasedUnderstanding,
  isValidAiOutput,
  mapAiOutputToUnderstanding,
} from './understanding.mapper';
import { renderUnderstandingPrompt } from './understanding.prompt';
import {
  contextToPromptPayload,
  filterQuestionsByFacts,
} from '../domain/discovery-context';

export class UnderstandingService {
  constructor(private readonly llm: LLMProvider = defaultLLMProvider) {}

  async generate(context: NormalizedDiscoveryContext) {
    const payload = contextToPromptPayload(context);
    const prompt = renderUnderstandingPrompt(JSON.stringify(payload, null, 2));

    let aiOutput: AiUnderstandingOutput | null = null;

    if (this.llm.name !== 'stub') {
      try {
        const raw = await this.llm.complete(
          [
            {
              role: 'system',
              content:
                'You are a business intelligence analyst. Respond with valid JSON only.',
            },
            { role: 'user', content: prompt },
          ],
          { model: routeModel('discovery'), temperature: 0.2 },
        );
        const parsed = createJsonParser<AiUnderstandingOutput>().parse(raw);
        if (isValidAiOutput(parsed)) {
          aiOutput = parsed;
        }
      } catch {
        aiOutput = null;
      }
    }

    const understanding = aiOutput
      ? mapAiOutputToUnderstanding(aiOutput)
      : buildFactBasedUnderstanding(context);

    const recommendations = aiOutput
      ? mapRecommendations(aiOutput)
      : mapFactBasedRecommendations(context);

    const questions = filterQuestionsByFacts(
      aiOutput
        ? mapQuestions(aiOutput)
        : buildDefaultQuestions(context),
      context,
    );

    return { understanding, recommendations, questions, aiOutput };
  }
}

function mapRecommendations(output: AiUnderstandingOutput): BiRecommendation[] {
  const recs: BiRecommendation[] = [];
  const confidence = output.confidence ?? 0.5;

  for (const mod of output.suggestedKodemModules ?? []) {
    recs.push({
      type: 'module',
      id: mod.toLowerCase().replace(/\s+/g, '_'),
      label: mod,
      priority: 'high',
      rationale: 'Suggested based on business understanding',
      confidence,
    });
  }

  for (const integration of output.suggestedIntegrations ?? []) {
    recs.push({
      type: 'integration',
      id: integration.toLowerCase().replace(/\s+/g, '_'),
      label: integration,
      priority: 'medium',
      rationale: 'Suggested based on marketing channels and business model',
      confidence: confidence * 0.9,
    });
  }

  if (output.missingInformation?.length) {
    recs.push({
      type: 'next_step',
      id: 'complete_profile',
      label: 'Complete business profile',
      priority: 'high',
      rationale: `Missing: ${output.missingInformation.slice(0, 3).join(', ')}`,
      confidence,
    });
  }

  return recs;
}

function mapFactBasedRecommendations(
  context: NormalizedDiscoveryContext,
): BiRecommendation[] {
  const recs: BiRecommendation[] = [
    {
      type: 'module',
      id: 'crm',
      label: 'CRM',
      priority: 'high',
      rationale: 'Core module for managing business relationships',
      confidence: 0.6,
    },
    {
      type: 'module',
      id: 'knowledge',
      label: 'Knowledge',
      priority: 'medium',
      rationale: 'Store discovered business context',
      confidence: 0.55,
    },
  ];

  if (context.assetsProcessed.some((a) => a.type === 'GOOGLE_BUSINESS')) {
    recs.push({
      type: 'integration',
      id: 'google_business',
      label: 'Google Business',
      priority: 'high',
      rationale: 'Google Business profile detected',
      confidence: 0.7,
    });
  }

  return recs;
}

function mapQuestions(output: AiUnderstandingOutput): BiQuestion[] {
  return (output.questionsForBusinessOwner ?? []).map((q, index) => ({
    id: `q_${index + 1}`,
    question: q.question,
    reason: q.reason,
    priority: q.priority ?? 'medium',
  }));
}

function buildDefaultQuestions(context: NormalizedDiscoveryContext): BiQuestion[] {
  const questions: BiQuestion[] = [];

  if (!context.factsByField.industry?.length) {
    questions.push({
      id: 'industry',
      question: 'What industry best describes your business?',
      reason: 'Industry was not detected from public sources',
      priority: 'high',
    });
  }

  if (!context.factsByField.services?.length) {
    questions.push({
      id: 'services',
      question: 'What are your main services?',
      reason: 'Services were not found on the public website',
      priority: 'high',
    });
  }

  questions.push({
    id: 'goals',
    question: 'What are your business goals for this year?',
    reason: 'Goals cannot be inferred from public data',
    priority: 'medium',
  });

  return questions;
}
