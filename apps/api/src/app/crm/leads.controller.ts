import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  BadRequestException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  ConvertLeadInput,
  CreateLeadInput,
  LeadStatus,
  PlatformContext,
  UpdateLeadInput,
} from '@kodem/contracts';
import { LEAD_STATUSES, LeadService } from '@kodem/modules/crm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('crm/leads')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('crm')
export class CrmLeadsController {
  private readonly leads = new LeadService();

  @Get()
  async list(@CurrentContext() context: PlatformContext) {
    const leads = await this.leads.list(context.workspace.id);
    return { leads };
  }

  @Get(':id')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const lead = await this.leads.get(context.workspace.id, id);
    if (!lead) throw new NotFoundException('Lead not found');
    return { lead };
  }

  @Post()
  async create(
    @CurrentContext() context: PlatformContext,
    @Body() body: CreateLeadInput,
  ) {
    try {
      const lead = await this.leads.create(context.workspace.id, body);
      return { lead };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create lead',
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: UpdateLeadInput,
  ) {
    try {
      const lead = await this.leads.update(context.workspace.id, id, body);
      return { lead };
    } catch (error) {
      if (error instanceof Error && error.message === 'Lead not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update lead',
      );
    }
  }

  @Patch(':id/status')
  async changeStatus(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: { status: LeadStatus },
  ) {
    if (!LEAD_STATUSES.includes(body.status)) {
      throw new BadRequestException('Invalid lead status');
    }
    try {
      const lead = await this.leads.changeStatus(
        context.workspace.id,
        id,
        body.status,
      );
      return { lead };
    } catch (error) {
      if (error instanceof Error && error.message === 'Lead not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update status',
      );
    }
  }

  @Post(':id/convert')
  async convert(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: ConvertLeadInput = {},
  ) {
    try {
      const result = await this.leads.convertToContact(
        context.workspace.id,
        id,
        body ?? {},
      );
      return result;
    } catch (error) {
      if (error instanceof Error && error.message === 'Lead not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to convert lead',
      );
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    try {
      await this.leads.delete(context.workspace.id, id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Lead not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete lead',
      );
    }
  }
}
