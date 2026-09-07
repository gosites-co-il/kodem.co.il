import { Controller, Get } from '@nestjs/common';
import { CatalogService } from '@kodem/platform/catalog';

@Controller('catalog')
export class CatalogController {
  private readonly catalog = new CatalogService();

  @Get('modules')
  modules() {
    return { modules: this.catalog.listModules() };
  }

  @Get('integrations')
  integrations() {
    return { integrations: this.catalog.listIntegrations() };
  }
}
