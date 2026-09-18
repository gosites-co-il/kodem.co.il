import { ContactDetailPage } from '../../../../../components/crm/contact-detail-page';

export default async function CrmContactDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ContactDetailPage contactId={id} />;
}
