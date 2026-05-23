-- CreateTable: IssueLog (replaces "Pictures of Damaged Products" doc + Issues sheet)
CREATE TABLE "IssueLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "country" TEXT,
    "warehouse" TEXT,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "itemsAffected" TEXT[],
    "description" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "videoUrl" TEXT,
    "resolution" TEXT NOT NULL DEFAULT 'pending',
    "resolutionNotes" TEXT,
    "agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IssueLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IssueLog_orderId_idx" ON "IssueLog"("orderId");
CREATE INDEX "IssueLog_category_idx" ON "IssueLog"("category");
CREATE INDEX "IssueLog_resolution_idx" ON "IssueLog"("resolution");
CREATE INDEX "IssueLog_createdAt_idx" ON "IssueLog"("createdAt");
