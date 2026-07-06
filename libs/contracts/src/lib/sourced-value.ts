/** A value collected by discovery with provenance and confidence. */
export interface SourcedValue<T = string> {
  value?: T;
  source?: string;
  confidence?: number;
}

export type ProfileFieldStatus = 'verified' | 'detected' | 'missing';
