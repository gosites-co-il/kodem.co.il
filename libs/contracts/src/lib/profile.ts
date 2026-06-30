import { Auditable } from './types';
import { WorkspaceId } from './ids';

export interface BusinessProfile extends Auditable {
  workspaceId: WorkspaceId;
  name: string;
  industry?: string;
  services: string[];
  classification?: string;
  communicationChannels: string[];
  hypotheses: string[];
  version: number;
}
