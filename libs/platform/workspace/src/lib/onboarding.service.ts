import {
  ONBOARDING_STEPS,
  type OnboardingData,
  type OnboardingStepId,
  type UpdateOnboardingInput,
  type Workspace,
  type WorkspaceId,
} from '@kodem/contracts';
import { WorkspaceRepository } from '@kodem/database';

const STEP_INDEX: Record<OnboardingStepId, number> = {
  business_name: 0,
  website: 1,
  industry: 2,
  business_size: 3,
  finish: 4,
};

export class OnboardingService {
  private readonly workspaceRepo = new WorkspaceRepository();

  async getState(workspaceId: WorkspaceId): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    return workspace;
  }

  async advanceStep(
    workspaceId: WorkspaceId,
    input: UpdateOnboardingInput,
  ): Promise<Workspace> {
    const stepIndex = STEP_INDEX[input.step];
    const patch = this.buildPatch(input.step, input.data);

    return this.workspaceRepo.updateOnboarding(workspaceId, {
      ...patch,
      onboardingStatus: 'IN_PROGRESS',
      onboardingStep: Math.max(stepIndex + 1, 1),
    });
  }

  async complete(workspaceId: WorkspaceId): Promise<Workspace> {
    return this.workspaceRepo.updateOnboarding(workspaceId, {
      onboardingStatus: 'COMPLETED',
      onboardingStep: ONBOARDING_STEPS.length,
      status: 'active',
    });
  }

  getStepId(workspace: Workspace): OnboardingStepId {
    const index = Math.min(
      workspace.onboardingStep,
      ONBOARDING_STEPS.length - 1,
    );
    return ONBOARDING_STEPS[index];
  }

  private buildPatch(
    step: OnboardingStepId,
    data: OnboardingData,
  ): Partial<{
    name: string;
    websiteUrl: string | null;
    industry: string | null;
    businessSize: string | null;
  }> {
    switch (step) {
      case 'business_name':
        return data.name ? { name: data.name } : {};
      case 'website':
        return {
          websiteUrl: data.websiteUrl?.trim() ? data.websiteUrl.trim() : null,
        };
      case 'industry':
        return data.industry ? { industry: data.industry } : {};
      case 'business_size':
        return data.businessSize ? { businessSize: data.businessSize } : {};
      case 'finish':
        return {};
      default:
        return {};
    }
  }
}
