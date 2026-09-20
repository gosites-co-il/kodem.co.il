import { getLegalDocument } from '@kodem/platform/legal';
import { AppLegalDocumentPage } from '../../../components/legal/app-legal-document-page';

export default function PrivacyPage() {
  return <AppLegalDocumentPage document={getLegalDocument('privacy')} />;
}
