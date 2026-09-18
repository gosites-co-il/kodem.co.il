import type { ChannelType } from './channels';

/**
 * Campaigns select a Channel — never a provider.
 * Full campaigns module is not implemented yet; this is the integration contract.
 */
export interface CampaignChannelSelection {
  channel: ChannelType;
}
