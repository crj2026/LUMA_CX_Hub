-- CreateTable: AdverseReaction (replaces Adverse Reactions Drive Word docs)
CREATE TABLE "AdverseReaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ticketId" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "country" TEXT,
    "patientSameAsCustomer" BOOLEAN NOT NULL DEFAULT true,
    "patientName" TEXT,
    "patientAge" TEXT,
    "complaintMethod" TEXT NOT NULL DEFAULT 'email',
    "complaintDescription" TEXT NOT NULL,
    "productsAffected" TEXT[],
    "lotNumbers" TEXT[],
    "symptoms" TEXT[],
    "severity" TEXT NOT NULL DEFAULT 'low',
    "isSerious" BOOLEAN NOT NULL DEFAULT false,
    "escalatedTo" TEXT,
    "fdaMedwatchFiled" BOOLEAN NOT NULL DEFAULT false,
    "mrddNumber" TEXT,
    "returnRequested" BOOLEAN NOT NULL DEFAULT false,
    "rmaNumber" TEXT,
    "followUpAt" TIMESTAMP(3),
    "followUpMethod" TEXT,
    "followUpNotes" TEXT,
    "qcReviewer" TEXT,
    "qcReviewedAt" TIMESTAMP(3),
    "qcNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "agent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdverseReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdverseReaction_orderId_idx" ON "AdverseReaction"("orderId");
CREATE INDEX "AdverseReaction_severity_idx" ON "AdverseReaction"("severity");
CREATE INDEX "AdverseReaction_isSerious_idx" ON "AdverseReaction"("isSerious");
CREATE INDEX "AdverseReaction_status_idx" ON "AdverseReaction"("status");
CREATE INDEX "AdverseReaction_createdAt_idx" ON "AdverseReaction"("createdAt");
