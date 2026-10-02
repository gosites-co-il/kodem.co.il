-- CreateTable
CREATE TABLE "CrmSettings" (
    "workspaceId" TEXT NOT NULL,
    "stages" TEXT NOT NULL DEFAULT '[]',
    "groups" TEXT NOT NULL DEFAULT '[]',
    "fields" TEXT NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmSettings_pkey" PRIMARY KEY ("workspaceId")
);

-- AddForeignKey
ALTER TABLE "CrmSettings" ADD CONSTRAINT "CrmSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
