import { BusinessProfile, BusinessReport, Insight, Recommendation, WorkspaceId } from '@kodem/contracts';
import { getPrismaClient } from './client';
import {
  mapProfileRowToDomain,
  mapProfileToPersistence,
} from './mappers/business-profile.mapper';
import {
  mapBusinessReportRowToDomain,
  mapBusinessReportToPersistence,
} from './mappers/business-report.mapper';
import {
  mapInsightRowToDomain,
  mapInsightToPersistence,
  mapRecommendationRowToDomain,
  mapRecommendationToPersistence,
} from './mappers/bkm.mapper';

export class BusinessProfileRepository {
  private readonly db = getPrismaClient();

  async upsert(profile: BusinessProfile): Promise<void> {
    const data = mapProfileToPersistence(profile);
    await this.db.businessProfile.upsert({
      where: { workspaceId: profile.workspaceId },
      create: data,
      update: data,
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<BusinessProfile | null> {
    const row = await this.db.businessProfile.findUnique({
      where: { workspaceId },
    });
    if (!row) return null;
    return mapProfileRowToDomain(row);
  }
}

export class BusinessReportRepository {
  private readonly db = getPrismaClient();

  async upsert(report: BusinessReport): Promise<void> {
    const data = mapBusinessReportToPersistence(report);
    await this.db.businessReport.upsert({
      where: { workspaceId: report.workspaceId },
      create: data,
      update: data,
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<BusinessReport | null> {
    const row = await this.db.businessReport.findUnique({
      where: { workspaceId },
    });
    if (!row) return null;
    return mapBusinessReportRowToDomain(row);
  }
}

export class InsightRepository {
  private readonly db = getPrismaClient();

  async saveMany(insights: Insight[]): Promise<void> {
    await this.db.insightRecord.createMany({
      data: insights.map(mapInsightToPersistence),
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Insight[]> {
    const rows = await this.db.insightRecord.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapInsightRowToDomain);
  }
}

export class RecommendationRepository {
  private readonly db = getPrismaClient();

  async saveMany(recommendations: Recommendation[]): Promise<void> {
    await this.db.recommendationRecord.createMany({
      data: recommendations.map(mapRecommendationToPersistence),
    });
  }

  async findByWorkspace(workspaceId: WorkspaceId): Promise<Recommendation[]> {
    const rows = await this.db.recommendationRecord.findMany({
      where: { workspaceId },
      orderBy: { priority: 'asc' },
    });
    return rows.map(mapRecommendationRowToDomain);
  }
}
