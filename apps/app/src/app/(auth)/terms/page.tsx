import { getLegalDocument } from '@kodem/platform/legal';
import { AppLegalDocumentPage } from '../../../components/legal/app-legal-document-page';

export default function TermsPage() {
  return <AppLegalDocumentPage document={getLegalDocument('terms')} />;
}
