import { Suspense } from 'react';
import { ConversationsInbox } from '../../../components/conversations/conversations-inbox';
import { CrmLoading } from '../../../components/crm/crm-ui';

export default function ConversationsPage() {
  return (
    <Suspense fallback={<CrmLoading label="טוען שיחות..." />}>
      <ConversationsInbox />
    </Suspense>
  );
}
