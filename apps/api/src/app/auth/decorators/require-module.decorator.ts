import { SetMetadata } from '@nestjs/common';
import type { ModuleId } from '@kodem/contracts';

export const REQUIRE_MODULE_KEY = 'require_module';

export const RequireModule = (moduleId: ModuleId) =>
  SetMetadata(REQUIRE_MODULE_KEY, moduleId);
