-- AlterTable
-- CreateTable
CREATE TABLE "LegalConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "locale" TEXT,
    "authMethod" TEXT,
    "workspaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalConsent_userId_document_idx" ON "LegalConsent"("userId", "document");

-- CreateIndex
CREATE INDEX "LegalConsent_userId_document_version_idx" ON "LegalConsent"("userId", "document", "version");

-- CreateIndex
CREATE INDEX "LegalConsent_acceptedAt_idx" ON "LegalConsent"("acceptedAt");

-- AddForeignKey
ALTER TABLE "LegalConsent" ADD CONSTRAINT "LegalConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
