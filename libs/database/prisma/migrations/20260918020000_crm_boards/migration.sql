-- CreateTable
CREATE TABLE "CrmBoard" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "preset" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmBoardColumn" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmBoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmBoardItem" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "leadId" TEXT,
    "contactId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmBoardItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmBoard_workspaceId_idx" ON "CrmBoard"("workspaceId");

-- CreateIndex
CREATE INDEX "CrmBoard_workspaceId_position_idx" ON "CrmBoard"("workspaceId", "position");

-- CreateIndex
CREATE INDEX "CrmBoardColumn_workspaceId_idx" ON "CrmBoardColumn"("workspaceId");

-- CreateIndex
CREATE INDEX "CrmBoardColumn_boardId_position_idx" ON "CrmBoardColumn"("boardId", "position");

-- CreateIndex
CREATE INDEX "CrmBoardItem_workspaceId_idx" ON "CrmBoardItem"("workspaceId");

-- CreateIndex
CREATE INDEX "CrmBoardItem_boardId_position_idx" ON "CrmBoardItem"("boardId", "position");

-- CreateIndex
CREATE INDEX "CrmBoardItem_columnId_position_idx" ON "CrmBoardItem"("columnId", "position");

-- CreateIndex
CREATE INDEX "CrmBoardItem_leadId_idx" ON "CrmBoardItem"("leadId");

-- CreateIndex
CREATE INDEX "CrmBoardItem_contactId_idx" ON "CrmBoardItem"("contactId");

-- CreateIndex
CREATE INDEX "CrmBoardItem_taskId_idx" ON "CrmBoardItem"("taskId");

-- AddForeignKey
ALTER TABLE "CrmBoard" ADD CONSTRAINT "CrmBoard_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardColumn" ADD CONSTRAINT "CrmBoardColumn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardColumn" ADD CONSTRAINT "CrmBoardColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "CrmBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardItem" ADD CONSTRAINT "CrmBoardItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardItem" ADD CONSTRAINT "CrmBoardItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "CrmBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardItem" ADD CONSTRAINT "CrmBoardItem_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "CrmBoardColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardItem" ADD CONSTRAINT "CrmBoardItem_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardItem" ADD CONSTRAINT "CrmBoardItem_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmBoardItem" ADD CONSTRAINT "CrmBoardItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CrmTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
