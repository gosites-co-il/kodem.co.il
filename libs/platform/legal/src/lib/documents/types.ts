import type {
  LegalDocumentCode,
  LegalDocumentId,
} from '@kodem/contracts';

export type LegalDocumentSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type LegalDocumentMeta = {
  id: LegalDocumentId;
  code: LegalDocumentCode;
  title: string;
  version: string;
  lastUpdated: string;
  route: string;
  locale: 'he';
  /**
   * When true, users who accepted an older version must accept again.
   * Leave false until a legally significant update ships.
   */
  requiresReconsent: boolean;
  /** Short explanation shown in re-consent UI. */
  reconsentSummary: string;
  description: string;
};

export type LegalDocument = LegalDocumentMeta & {
  sections: LegalDocumentSection[];
};
