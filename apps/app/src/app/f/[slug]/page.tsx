import { Suspense } from 'react';
import { PublicConversationForm } from '../../../components/conversations/public-conversation-form';

export default async function PublicConversationFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={null}>
      <PublicConversationForm slug={slug} />
    </Suspense>
  );
}
