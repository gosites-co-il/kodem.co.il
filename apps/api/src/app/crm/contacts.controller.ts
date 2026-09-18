import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateContactInput,
  PlatformContext,
  UpdateContactInput,
} from '@kodem/contracts';
import { ContactService } from '@kodem/modules/crm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModuleGuard } from '../auth/guards/module.guard';
import { RequireModule } from '../auth/decorators/require-module.decorator';
import { CurrentContext } from '../auth/decorators/current-context.decorator';

@Controller('crm/contacts')
@UseGuards(JwtAuthGuard, ModuleGuard)
@RequireModule('crm')
export class CrmContactsController {
  private readonly contacts = new ContactService();

  @Get()
  async list(@CurrentContext() context: PlatformContext) {
    const contacts = await this.contacts.list(context.workspace.id);
    return { contacts };
  }

  @Get(':id')
  async get(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
  ) {
    const contact = await this.contacts.get(context.workspace.id, id);
    if (!contact) throw new NotFoundException('Contact not found');
    return { contact };
  }

  @Post()
  async create(
    @CurrentContext() context: PlatformContext,
    @Body() body: CreateContactInput,
  ) {
    try {
      const contact = await this.contacts.create(context.workspace.id, body);
      return { contact };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create contact',
      );
    }
  }

  @Patch(':id')
  async update(
    @CurrentContext() context: PlatformContext,
    @Param('id') id: string,
    @Body() body: UpdateContactInput,
  ) {
    try {
      const contact = await this.contacts.update(
        context.workspace.id,
        id,
        body,
      );
      return { contact };
    } catch (error) {
      if (error instanceof Error && error.message === 'Contact not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to update contact',
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
      await this.contacts.delete(context.workspace.id, id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Contact not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to delete contact',
      );
    }
  }
}
