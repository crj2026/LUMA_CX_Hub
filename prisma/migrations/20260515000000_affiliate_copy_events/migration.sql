-- CreateTable: per-click event log for the Affiliates tab's Copy
-- buttons. Used to identify which "not in Gorgias yet" macros are
-- being copied most, so we know what to add to Gorgias next.
CREATE TABLE "AffiliateCopyEvent" (
    "id"        TEXT NOT NULL,
    "macroName" TEXT NOT NULL,
    "copyType"  TEXT NOT NULL,
    "inGorgias" BOOLEAN NOT NULL DEFAULT false,
    "userId"    TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateCopyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AffiliateCopyEvent_macroName_idx" ON "AffiliateCopyEvent"("macroName");
CREATE INDEX "AffiliateCopyEvent_createdAt_idx" ON "AffiliateCopyEvent"("createdAt");
CREATE INDEX "AffiliateCopyEvent_inGorgias_createdAt_idx" ON "AffiliateCopyEvent"("inGorgias", "createdAt");
