import {
  BusinessProfileRepository,
  InsightRepository,
  RecommendationRepository,
} from '@kodem/database';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentContext } from '../auth/decorators/current-context.decorator';
import type { PlatformContext } from '@kodem/contracts';

@Controller('workspace/overview')
export class WorkspaceOverviewController {
  private readonly profileRepo = new BusinessProfileRepository();
  private readonly insightRepo = new InsightRepository();
  private readonly recommendationRepo = new RecommendationRepository();

  @Get()
  @UseGuards(JwtAuthGuard)
  async overview(@CurrentContext() context: PlatformContext) {
    const workspaceId = context.workspace.id;
    const [profile, insights, recommendations] = await Promise.all([
      this.profileRepo.findByWorkspace(workspaceId),
      this.insightRepo.findByWorkspace(workspaceId),
      this.recommendationRepo.findByWorkspace(workspaceId),
    ]);

    const primaryRecommendation = recommendations.find((r) => r.isPrimary) ??
      recommendations[0];

    return {
      workspace: context.workspace,
      profile,
      insights,
      recommendations,
      primaryRecommendation,
      discoveryProgress: {
        website: Boolean(context.workspace.websiteUrl),
        profile: Boolean(profile),
        insights: insights.length > 0,
        recommendations: recommendations.length > 0,
      },
    };
  }
}
