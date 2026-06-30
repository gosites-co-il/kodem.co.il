import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateWorkspaceInput } from '@kodem/contracts';
import { WorkspaceService } from './workspace.service';
import {
  BusinessProfileRepository,
  InsightRepository,
  RecommendationRepository,
} from '@kodem/database';

@Controller('workspaces')
export class WorkspaceController {
  private readonly profileRepo = new BusinessProfileRepository();
  private readonly insightRepo = new InsightRepository();
  private readonly recommendationRepo = new RecommendationRepository();

  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      slug: string;
      websiteUrl?: string;
      ownerEmail: string;
      ownerName: string;
    },
  ) {
    if (!body.name || !body.slug || !body.ownerEmail || !body.ownerName) {
      throw new BadRequestException('Missing required fields');
    }

    const input: CreateWorkspaceInput = {
      name: body.name,
      slug: body.slug,
      websiteUrl: body.websiteUrl,
      ownerEmail: body.ownerEmail,
      ownerName: body.ownerName,
    };

    try {
      const workspace = await this.workspaceService.create(input);
      return { workspace, message: 'Workspace created. Engines processing via worker.' };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create workspace',
      );
    }
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const workspace = await this.workspaceService.findBySlug(slug);
    if (!workspace) {
      throw new NotFoundException(`Workspace "${slug}" not found`);
    }

    const [profile, insights, recommendations] = await Promise.all([
      this.profileRepo.findByWorkspace(workspace.id),
      this.insightRepo.findByWorkspace(workspace.id),
      this.recommendationRepo.findByWorkspace(workspace.id),
    ]);

    return { workspace, profile, insights, recommendations };
  }
}
