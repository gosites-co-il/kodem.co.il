import { getLegalDocument } from '@kodem/platform/legal';
import { AppLegalDocumentPage } from '../../../components/legal/app-legal-document-page';

export default function CookiesPage() {
  return <AppLegalDocumentPage document={getLegalDocument('cookies')} />;
}
