import { BusinessProfile } from '@kodem/business';
import { WorkspaceId } from '@kodem/core';
import { Insight } from '@kodem/insights';
import { Recommendation } from '@kodem/recommendations';
import { getPrismaClient } from './client';

export class BusinessProfileRepository {
  private readonly db = getPrismaClient();

  async upsert(profile: BusinessProfile): Promise<void> {
    await this.db.businessProfile.upsert({
      where: { workspaceId: profile.workspaceId },
      create: {
        workspaceId: profile.workspaceId,
        name: profile.name,
        industry: profile.industry,
        services: JSON.stringify(profile.services),
        classification: profile.classification,
        communicationChannels: JSON.stringify(profile.communicationChannels),
        hypotheses: JSON.stringify(profile.hypotheses),
        version: profile.version,
      },
      update: {
        name: profile.name,
        industry: profile.industry,
        services: JSON.stringify(profile.services),
        classification: profile.classification,
        communicationChannels: JSON.stringify(profile.communicationChannels),
        hypotheses: JSON.stringify(profile.hypotheses),
        version: profile.version,
      },
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<BusinessProfile | null> {
    const row = await this.db.businessProfile.findUnique({
      where: { workspaceId },
    });
    if (!row) return null;
    return {
      workspaceId: row.workspaceId as WorkspaceId,
      name: row.name,
      industry: row.industry ?? undefined,
      services: JSON.parse(row.services),
      classification: row.classification ?? undefined,
      communicationChannels: JSON.parse(row.communicationChannels),
      hypotheses: JSON.parse(row.hypotheses),
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

export class InsightRepository {
  private readonly db = getPrismaClient();

  async saveMany(insights: Insight[]): Promise<void> {
    await this.db.insightRecord.createMany({
      data: insights.map((i) => ({
        id: i.id,
        workspaceId: i.workspaceId,
        title: i.title,
        what: i.what,
        why: i.why,
        confidence: i.confidence,
        supportingData: JSON.stringify(i.supportingData),
        createdAt: i.createdAt,
      })),
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Insight[]> {
    const rows = await this.db.insightRecord.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id as Insight['id'],
      workspaceId: row.workspaceId as WorkspaceId,
      title: row.title,
      what: row.what,
      why: row.why,
      confidence: row.confidence,
      supportingData: JSON.parse(row.supportingData),
      createdAt: row.createdAt,
    }));
  }
}

export class RecommendationRepository {
  private readonly db = getPrismaClient();

  async saveMany(recommendations: Recommendation[]): Promise<void> {
    await this.db.recommendationRecord.createMany({
      data: recommendations.map((r) => ({
        id: r.id,
        workspaceId: r.workspaceId,
        action: r.action,
        rationale: r.rationale,
        expectedImpact: r.expectedImpact,
        priority: r.priority,
        isPrimary: r.isPrimary,
        createdAt: r.createdAt,
      })),
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Recommendation[]> {
    const rows = await this.db.recommendationRecord.findMany({
      where: { workspaceId },
      orderBy: { priority: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id as Recommendation['id'],
      workspaceId: row.workspaceId as WorkspaceId,
      action: row.action,
      rationale: row.rationale,
      expectedImpact: row.expectedImpact as Recommendation['expectedImpact'],
      priority: row.priority,
      isPrimary: row.isPrimary,
      createdAt: row.createdAt,
    }));
  }
}
