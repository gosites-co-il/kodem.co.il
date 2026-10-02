import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import type {
  CrmContactGroup,
  CrmCustomField,
  CrmSettings,
  CrmStage,
  PlatformContext,
} from '@kodem/contracts';
import { CrmSettingsRepository } from '@kodem/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

const HEX = /^#[0-9a-fA-F]{6}$/;

const DEFAULT_STAGES: CrmStage[] = [
  { id: 'stage_new', label: 'ליד חדש', color: '#A855F7', position: 0 },
  { id: 'stage_progress', label: 'בתהליך', color: '#F97316', position: 1 },
  { id: 'stage_customer', label: 'לקוח משלם', color: '#22C55E', position: 2 },
  { id: 'stage_irrelevant', label: 'לא רלוונטי', color: '#64748B', position: 3 },
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function color(value: unknown): string | null {
  return typeof value === 'string' && HEX.test(value) ? value.toUpperCase() : null;
}

function parseSettings(body: unknown): CrmSettings {
  const root = asRecord(body);
  if (!root) throw new BadRequestException('הגדרות לא תקינות');

  const stagesRaw = Array.isArray(root.stages) ? root.stages : null;
  const groupsRaw = Array.isArray(root.groups) ? root.groups : null;
  const fieldsRaw = Array.isArray(root.fields) ? root.fields : null;
  if (!stagesRaw || !groupsRaw || !fieldsRaw) {
    throw new BadRequestException('הגדרות לא תקינות');
  }
  if (stagesRaw.length < 1 || stagesRaw.length > 30) {
    throw new BadRequestException('צריך לפחות שלב אחד, ועד 30');
  }
  if (groupsRaw.length > 50 || fieldsRaw.length > 50) {
    throw new BadRequestException('יותר מדי פריטים');
  }

  const stages: CrmStage[] = stagesRaw.map((item, index) => {
    const row = asRecord(item);
    const id = text(row?.id, 80);
    const label = text(row?.label, 80);
    const stageColor = color(row?.color);
    if (!row || !id || !label || !stageColor) {
      throw new BadRequestException('שלב לא תקין');
    }
    return { id, label, color: stageColor, position: index };
  });

  const groups: CrmContactGroup[] = groupsRaw.map((item) => {
    const row = asRecord(item);
    const id = text(row?.id, 80);
    const name = text(row?.name, 80);
    const groupColor = color(row?.color);
    if (!row || !id || !name || !groupColor) {
      throw new BadRequestException('קבוצה לא תקינה');
    }
    return { id, name, color: groupColor };
  });

  const fields: CrmCustomField[] = fieldsRaw.map((item) => {
    const row = asRecord(item);
    const id = text(row?.id, 80);
    const name = text(row?.name, 80);
    const type = row?.type === 'text' || row?.type === 'number' ? row.type : null;
    if (!row || !id || !name || !type || typeof row.aiOnly !== 'boolean' || typeof row.active !== 'boolean') {
      throw new BadRequestException('שדה לא תקין');
    }
    return { id, name, type, aiOnly: row.aiOnly, active: row.active };
  });

  const ids = [...stages, ...groups, ...fields].map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestException('מזהה כפול');
  }

  return { stages, groups, fields };
}

@Controller('crm/settings')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('crm')
export class CrmSettingsController {
  private readonly settings = new CrmSettingsRepository();

  @Get()
  async read(@CurrentContext() context: PlatformContext) {
    const existing = await this.settings.find(context.workspace.id);
    if (existing) return existing;
    return this.settings.save(context.workspace.id, {
      stages: DEFAULT_STAGES,
      groups: [],
      fields: [],
    });
  }

  @Put()
  async update(
    @CurrentContext() context: PlatformContext,
    @Body() body: unknown,
  ) {
    const next = parseSettings(body);
    return this.settings.save(context.workspace.id, next);
  }
}
