export type IntegrationProvider =
  | 'google'
  | 'meta'
  | 'whatsapp'
  | 'email'
  | 'webhook';

export interface IntegrationConfig {
  provider: IntegrationProvider;
  enabled: boolean;
  credentialsRef?: string;
  settings?: Record<string, string>;
}

export interface IntegrationAdapter {
  readonly provider: IntegrationProvider;
  connect(config: IntegrationConfig): Promise<{ success: boolean; error?: string }>;
  disconnect(): Promise<void>;
}
