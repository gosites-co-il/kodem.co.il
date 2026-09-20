import { getLegalDocument } from '@kodem/platform/legal';
import { AppLegalDocumentPage } from '../../../components/legal/app-legal-document-page';

export default function AiTermsPage() {
  return <AppLegalDocumentPage document={getLegalDocument('ai-terms')} />;
}
