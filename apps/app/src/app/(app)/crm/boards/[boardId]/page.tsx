import { BoardDetailPage } from '../../../../../components/crm/board-detail-page';

export default async function CrmBoardDetailRoute({
  params,
}: {
  params: Promise<{ boardId: string }>;
}) {
  const { boardId } = await params;
  return <BoardDetailPage boardId={boardId} />;
}
