-- CreateTable
CREATE TABLE "WorkspaceConnection" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "externalAccountId" TEXT,
    "externalAccountName" TEXT,
    "metadata" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionCredential" (
    "connectionId" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectionCredential_pkey" PRIMARY KEY ("connectionId")
);

-- CreateTable
CREATE TABLE "WorkspaceChannel" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_configured',
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelConnectionBinding" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChannelConnectionBinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceConnection_workspaceId_integrationId_key" ON "WorkspaceConnection"("workspaceId", "integrationId");

-- CreateIndex
CREATE INDEX "WorkspaceConnection_workspaceId_status_idx" ON "WorkspaceConnection"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceConnection_workspaceId_provider_idx" ON "WorkspaceConnection"("workspaceId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceChannel_workspaceId_type_key" ON "WorkspaceChannel"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "WorkspaceChannel_workspaceId_status_idx" ON "WorkspaceChannel"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConnectionBinding_channelId_connectionId_key" ON "ChannelConnectionBinding"("channelId", "connectionId");

-- CreateIndex
CREATE INDEX "ChannelConnectionBinding_connectionId_idx" ON "ChannelConnectionBinding"("connectionId");

-- AddForeignKey
ALTER TABLE "WorkspaceConnection" ADD CONSTRAINT "WorkspaceConnection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceConnection" ADD CONSTRAINT "WorkspaceConnection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectionCredential" ADD CONSTRAINT "ConnectionCredential_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "WorkspaceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceChannel" ADD CONSTRAINT "WorkspaceChannel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConnectionBinding" ADD CONSTRAINT "ChannelConnectionBinding_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "WorkspaceChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConnectionBinding" ADD CONSTRAINT "ChannelConnectionBinding_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "WorkspaceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
