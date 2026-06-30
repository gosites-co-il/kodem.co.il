import { WorkspaceId } from '@kodem/core';
import { BusinessProfile } from '@kodem/business';

export interface DiscoveryInput {
  workspaceId: WorkspaceId;
  websiteUrl?: string;
  businessName: string;
}

export interface DiscoveryOutput {
  profile: Omit<BusinessProfile, 'createdAt' | 'updatedAt'>;
  hypotheses: string[];
}

export interface EngineResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Engine<TInput, TOutput> {
  readonly name: string;
  run(input: TInput): Promise<EngineResult<TOutput>>;
}
